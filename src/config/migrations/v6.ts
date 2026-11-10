// Versão 6 do esquema: a integridade fica no próprio banco (DADOS-4). Não mude este arquivo: uma
// versão publicada não muda mais.
//
// - Os flags só aceitam 0 ou 1, o porte só os quatro do app e os horários só "HH:MM", de 00:00 a 23:59
//   (CHECK). O horário padrão do pet passa a ser NOT NULL, como a hora do agendamento (PR #49).
// - O serviço (do pet e do agendamento) e a forma de pagamento passam a ser gravados pelo id, com chave
//   estrangeira, no lugar do texto. Renomear um item da lista não deixa mais os registros antigos
//   apontando para um nome que não existe. A forma de pagamento nula é "não informada".
// - Sai o idx_appointments_pet_id, que repetia o começo do idx_appointments_pet_data e do
//   idx_appointments_auto_pendentes.
//
// O dado antigo que violaria um CHECK é corrigido na cópia, pela regra que o app já usa: flag diferente
// de zero é ligado (os builders), horário vazio ou inválido é "00:00" (versão 5) e porte desconhecido é
// o "MEDIO" do formulário. O nome de serviço ou de pagamento que não estiver na lista entra nela, para
// nenhum agendamento perder o que tinha. Um backup antigo passa por esta mesma migração.
//
// Como as versões 2 e 3, esta traz o texto inteiro do que cria, sem reaproveitar as constantes das
// versões anteriores. As chaves estrangeiras ficam desligadas durante as migrações (migrator.ts).
import type { Migration } from "../migrator";

// ── Conversão dos dados ───────────────────────────────────────────────────

/** Diferente de zero vira 1, como o withEntregarPet, o isConcluido e os outros builders do app. */
const flagFrom = (column: string) => `CASE WHEN ${column} = 0 THEN 0 ELSE 1 END`;

/** "HH:MM", de 00:00 a 23:59. É o mesmo formato do campo de horário do app (validation/fields.ts). */
const isHourMinute = (value: string) =>
  `(${value} GLOB '[01][0-9]:[0-5][0-9]' OR ${value} GLOB '2[0-3]:[0-5][0-9]')`;

/** '09:30' fica; '9:30' vira '09:30'; nulo, vazio ou fora do formato vira '00:00', o "sem horário". */
function timeFrom(column: string): string {
  const value = `trim(${column})`;
  return `CASE
    WHEN ${isHourMinute(value)} THEN ${value}
    WHEN ${value} GLOB '[0-9]:[0-5][0-9]' THEN '0' || ${value}
    ELSE '00:00'
  END`;
}

/**
 * Em maio de 2026, o app gravou o rótulo do porte ("Pequeno", "Medio", "Grandão"), e não a chave. O
 * upper do SQLite só troca as letras sem acento, então os acentos saem à parte. O que mesmo assim não
 * for um porte do app vira o "MEDIO", o padrão do formulário.
 */
function porteFrom(column: string): string {
  const key = `replace(replace(replace(replace(upper(trim(${column})), 'é', 'E'), 'É', 'E'), 'ã', 'A'), 'Ã', 'A')`;
  return `CASE WHEN ${key} IN ('PEQUENO', 'MEDIO', 'GRANDE', 'GRANDAO') THEN ${key} ELSE 'MEDIO' END`;
}

const serviceIdOf = (name: string) => `(SELECT id FROM service_type WHERE servico = ${name})`;

/**
 * Troca a tabela pela versão nova, com as colunas copiadas e as de `conversions` calculadas a partir
 * da tabela antiga. A contagem de ids (sqlite_sequence) passa para a tabela nova, para um id apagado
 * não voltar a ser usado.
 */
function rebuildTable(
  table: string,
  definition: string,
  columns: readonly string[],
  conversions: Readonly<Record<string, string>>,
): string {
  const next = `${table}_v6`;
  const values = columns.map((column) => conversions[column] ?? column);
  return `
    CREATE TABLE ${next} (${definition});
    INSERT INTO ${next} (${columns.join(", ")})
      SELECT ${values.join(", ")} FROM ${table};
    DELETE FROM sqlite_sequence WHERE name = '${next}';
    UPDATE sqlite_sequence SET name = '${next}' WHERE name = '${table}';
    DROP TABLE ${table};
    ALTER TABLE ${next} RENAME TO ${table};
  `;
}

// Os triggers saem antes das tabelas: o SQLite recusa renomear uma tabela enquanto um trigger cita
// outra que está sendo trocada. Voltam no fim, com o mesmo texto da versão 3.
export const SQL_DROP_TRIGGERS_V6 = `
  DROP TRIGGER IF EXISTS trg_ultima_visita;
  DROP TRIGGER IF EXISTS trg_pet_remarcacao_desativar;
  DROP TRIGGER IF EXISTS trg_owner_desativar_pets;
  DROP TRIGGER IF EXISTS trg_pet_ativar_owner;
  DROP TRIGGER IF EXISTS trg_pet_desativar_limpar_remarcacao;
`;

// ── Listas de serviço e de forma de pagamento ─────────────────────────────

// O agendamento passa a apontar para a forma de pagamento pelo id, achado pelo nome. Um nome repetido
// na lista deixaria a escolha ambígua; como nada apontava para o id antes desta versão, as cópias saem
// sem perder informação, e o nome passa a ser único, como o do serviço já era.
export const SQL_UNIQUE_PAYMENT_METHODS_V6 = `
  DELETE FROM payment_methods
  WHERE id NOT IN (SELECT MIN(id) FROM payment_methods GROUP BY tipo_pgto);
  CREATE UNIQUE INDEX idx_payment_methods_tipo_pgto ON payment_methods (tipo_pgto);
`;

// Um nome que não está na lista (gravado por uma versão antiga ou por um backup) entra nela. O vazio
// fica de fora: no pagamento, ele e o "0" do DEFAULT antigo querem dizer "não informado".
export const SQL_KEEP_UNKNOWN_NAMES_V6 = `
  INSERT INTO service_type (servico)
    SELECT trim(servico_padrao) FROM pets
    WHERE trim(servico_padrao) <> '' AND trim(servico_padrao) NOT IN (SELECT servico FROM service_type)
    UNION
    SELECT trim(servico) FROM appointments
    WHERE trim(servico) <> '' AND trim(servico) NOT IN (SELECT servico FROM service_type);

  INSERT INTO payment_methods (tipo_pgto)
    SELECT DISTINCT trim(tipo_pgto) FROM appointments
    WHERE trim(tipo_pgto) NOT IN ('', '0') AND trim(tipo_pgto) NOT IN (SELECT tipo_pgto FROM payment_methods);
`;

// ── Tabelas ───────────────────────────────────────────────────────────────
// As mesmas colunas da versão 3, na mesma ordem. Mudam os CHECKs, o NOT NULL do horário padrão e as
// colunas de serviço e de pagamento, que passam a guardar o id.

const TODAY = `date('now', 'localtime')`;

export const SQL_REBUILD_CONFIGS_V6 = rebuildTable(
  "configs",
  `
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    config   TEXT    NOT NULL UNIQUE,
    is_ativo INTEGER NOT NULL DEFAULT 0 CHECK (is_ativo IN (0, 1))
  `,
  ["id", "config", "is_ativo"],
  { is_ativo: flagFrom("is_ativo") },
);

export const SQL_REBUILD_OWNERS_V6 = rebuildTable(
  "owners",
  `
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    nome             TEXT    NOT NULL,
    nome_normalizado TEXT    NOT NULL DEFAULT '',
    telefone         TEXT    NOT NULL,
    email            TEXT,
    endereco         TEXT,
    is_ativo         INTEGER NOT NULL DEFAULT 1 CHECK (is_ativo IN (0, 1)),
    criado_em        TEXT    NOT NULL DEFAULT (${TODAY})
  `,
  ["id", "nome", "nome_normalizado", "telefone", "email", "endereco", "is_ativo", "criado_em"],
  { is_ativo: flagFrom("is_ativo") },
);

// Sem nome de serviço, o pet fica com o "Banho", o DEFAULT da coluna de texto.
export const SQL_REBUILD_PETS_V6 = rebuildTable(
  "pets",
  `
    id                         INTEGER PRIMARY KEY AUTOINCREMENT,
    nome                       TEXT    NOT NULL,
    nome_normalizado           TEXT    NOT NULL DEFAULT '',
    especie                    INTEGER NOT NULL,
    porte                      TEXT    NOT NULL CHECK (porte IN ('PEQUENO', 'MEDIO', 'GRANDE', 'GRANDAO')),
    raca                       INTEGER NOT NULL,
    observacoes                TEXT,
    dono_id                    INTEGER NOT NULL,
    servico_padrao_id          INTEGER NOT NULL,
    remarcacao_ativa           INTEGER NOT NULL DEFAULT 0 CHECK (remarcacao_ativa IN (0, 1)),
    pacote_remarcacao          INTEGER CHECK (pacote_remarcacao IN (2, 4)),
    valor_pacote               INTEGER DEFAULT 0,
    data_inicio_pacote         TEXT,
    horario_padrao             TEXT    NOT NULL DEFAULT '00:00' CHECK ${isHourMinute("horario_padrao")},
    current_ultima_visita_data TEXT,
    ultimo_visita_data_auto    TEXT,
    is_ativo                   INTEGER NOT NULL DEFAULT 1 CHECK (is_ativo IN (0, 1)),
    criado_em                  TEXT    NOT NULL DEFAULT (${TODAY}),
    FOREIGN KEY (dono_id)           REFERENCES owners(id)       ON DELETE CASCADE,
    FOREIGN KEY (especie)           REFERENCES species(id)      ON DELETE RESTRICT,
    FOREIGN KEY (raca)              REFERENCES race(id)         ON DELETE RESTRICT,
    FOREIGN KEY (servico_padrao_id) REFERENCES service_type(id) ON DELETE RESTRICT
  `,
  [
    "id", "nome", "nome_normalizado", "especie", "porte", "raca", "observacoes", "dono_id",
    "servico_padrao_id", "remarcacao_ativa", "pacote_remarcacao", "valor_pacote", "data_inicio_pacote",
    "horario_padrao", "current_ultima_visita_data", "ultimo_visita_data_auto", "is_ativo", "criado_em",
  ],
  {
    porte: porteFrom("porte"),
    servico_padrao_id: `COALESCE(${serviceIdOf("trim(pets.servico_padrao)")}, ${serviceIdOf("'Banho'")})`,
    remarcacao_ativa: flagFrom("remarcacao_ativa"),
    horario_padrao: timeFrom("horario_padrao"),
    is_ativo: flagFrom("is_ativo"),
  },
);

// Roda depois dos pets: um agendamento sem nome de serviço fica com o serviço padrão do pet e, se nem
// o pet existir, com o "Banho".
export const SQL_REBUILD_APPOINTMENTS_V6 = rebuildTable(
  "appointments",
  `
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id       INTEGER NOT NULL,
    servico_id   INTEGER NOT NULL,
    data         TEXT    NOT NULL,
    hora         TEXT    NOT NULL DEFAULT '00:00' CHECK ${isHourMinute("hora")},
    dia_semana   INTEGER GENERATED ALWAYS AS (CAST(strftime('%w', data) AS INTEGER)) VIRTUAL,
    entregar_pet INTEGER NOT NULL DEFAULT 0 CHECK (entregar_pet IN (0, 1)),
    concluido    INTEGER NOT NULL DEFAULT 0 CHECK (concluido IN (0, 1)),
    observacao   TEXT,
    is_auto_agen INTEGER NOT NULL DEFAULT 0 CHECK (is_auto_agen IN (0, 1)),
    valor        INTEGER NOT NULL DEFAULT 0,
    tipo_pgto_id INTEGER,
    ta_pago      INTEGER NOT NULL DEFAULT 0 CHECK (ta_pago IN (0, 1)),
    criado_em    TEXT    NOT NULL DEFAULT (${TODAY}),
    FOREIGN KEY (pet_id)       REFERENCES pets(id)            ON DELETE CASCADE,
    FOREIGN KEY (servico_id)   REFERENCES service_type(id)    ON DELETE RESTRICT,
    FOREIGN KEY (tipo_pgto_id) REFERENCES payment_methods(id) ON DELETE RESTRICT
  `,
  [
    "id", "pet_id", "servico_id", "data", "hora", "entregar_pet", "concluido", "observacao",
    "is_auto_agen", "valor", "tipo_pgto_id", "ta_pago", "criado_em",
  ],
  {
    servico_id: `COALESCE(
      ${serviceIdOf("trim(appointments.servico)")},
      (SELECT servico_padrao_id FROM pets WHERE pets.id = appointments.pet_id),
      ${serviceIdOf("'Banho'")}
    )`,
    hora: timeFrom("hora"),
    entregar_pet: flagFrom("entregar_pet"),
    concluido: flagFrom("concluido"),
    is_auto_agen: flagFrom("is_auto_agen"),
    tipo_pgto_id: `(SELECT id FROM payment_methods WHERE tipo_pgto = trim(appointments.tipo_pgto))`,
    ta_pago: flagFrom("ta_pago"),
  },
);

// ── Índices ───────────────────────────────────────────────────────────────
// Os da versão 3, que somem junto com as tabelas antigas, menos o idx_appointments_pet_id: o
// idx_appointments_pet_data começa pela mesma coluna e serve às mesmas buscas, inclusive à da cascata.

export const SQL_CREATE_INDEXES_V6 = `
  CREATE INDEX idx_pets_dono_id ON pets (dono_id);
  CREATE INDEX idx_appointments_pet_data ON appointments (pet_id, data);
  CREATE INDEX idx_appointments_data_concluido ON appointments (data, concluido);
  CREATE INDEX idx_owners_nome_normalizado ON owners (nome_normalizado);
  CREATE INDEX idx_pets_nome_normalizado ON pets (nome_normalizado);
  CREATE INDEX idx_appointments_stats ON appointments (concluido, dia_semana);
  CREATE INDEX idx_appointments_perf_hora ON appointments (concluido, CAST(substr(hora, 1, 2) AS INTEGER));
  CREATE INDEX idx_appointments_auto_agen ON appointments (concluido, is_auto_agen);
  CREATE INDEX idx_pets_ausentes ON pets (remarcacao_ativa, is_ativo, current_ultima_visita_data);
  CREATE INDEX idx_appointments_mensal ON appointments (concluido, data);
  CREATE INDEX idx_appointments_auto_pendentes ON appointments (pet_id, is_auto_agen, concluido, data);
`;

// ── Triggers ──────────────────────────────────────────────────────────────
// Os cinco que ficaram depois da versão 4, com o texto da versão 3 e na mesma ordem de criação, que é
// a ordem em que o SQLite os dispara.

// Ao desligar a remarcação, apaga os automáticos pendentes a partir de amanhã.
export const SQL_TRIGGER_PET_REMARCACAO_DESATIVAR_V6 = `
  CREATE TRIGGER trg_pet_remarcacao_desativar
  AFTER UPDATE OF remarcacao_ativa ON pets
  FOR EACH ROW
  WHEN OLD.remarcacao_ativa = 1 AND NEW.remarcacao_ativa = 0
  BEGIN
    DELETE FROM appointments
    WHERE pet_id = NEW.id
      AND is_auto_agen = 1
      AND concluido = 0
      AND data > ${TODAY};
  END;
`;

// Desativar o dono desativa os pets dele.
export const SQL_TRIGGER_OWNER_DESATIVAR_PETS_V6 = `
  CREATE TRIGGER trg_owner_desativar_pets
  AFTER UPDATE OF is_ativo ON owners
  FOR EACH ROW
  WHEN NEW.is_ativo = 0
  BEGIN
    UPDATE pets
    SET is_ativo = 0
    WHERE dono_id = NEW.id;
  END;
`;

// Reativar um pet reativa o dono, se estiver inativo.
export const SQL_TRIGGER_PET_ATIVAR_OWNER_V6 = `
  CREATE TRIGGER trg_pet_ativar_owner
  AFTER UPDATE OF is_ativo ON pets
  FOR EACH ROW
  WHEN NEW.is_ativo = 1
  BEGIN
    UPDATE owners
    SET is_ativo = 1
    WHERE id = NEW.dono_id AND is_ativo = 0;
  END;
`;

// Ao desativar o pet, apaga os automáticos futuros e limpa o pacote.
export const SQL_TRIGGER_PET_DESATIVAR_LIMPAR_REMARCACAO_V6 = `
  CREATE TRIGGER trg_pet_desativar_limpar_remarcacao
  AFTER UPDATE OF is_ativo ON pets
  FOR EACH ROW
  WHEN OLD.is_ativo = 1 AND NEW.is_ativo = 0
  BEGIN
    DELETE FROM appointments
    WHERE pet_id = NEW.id
      AND is_auto_agen = 1
      AND concluido = 0
      AND data > ${TODAY};

    UPDATE pets
    SET data_inicio_pacote = NULL,
        ultimo_visita_data_auto = NULL,
        remarcacao_ativa = 0
    WHERE id = NEW.id;
  END;
`;

// Só a passagem de pendente para concluído grava a última visita (BUG-3).
export const SQL_TRIGGER_ULTIMA_VISITA_V6 = `
  CREATE TRIGGER trg_ultima_visita
  AFTER UPDATE OF concluido ON appointments
  FOR EACH ROW
  WHEN OLD.concluido = 0 AND NEW.concluido = 1
  BEGIN
    UPDATE pets
    SET current_ultima_visita_data = NEW.data
    WHERE id = NEW.pet_id;
  END;
`;

export const V6: Migration = {
  version: 6,
  statements: [
    SQL_DROP_TRIGGERS_V6,
    SQL_UNIQUE_PAYMENT_METHODS_V6,
    SQL_KEEP_UNKNOWN_NAMES_V6,
    SQL_REBUILD_CONFIGS_V6,
    SQL_REBUILD_OWNERS_V6,
    SQL_REBUILD_PETS_V6,
    SQL_REBUILD_APPOINTMENTS_V6,
    SQL_CREATE_INDEXES_V6,
    SQL_TRIGGER_PET_REMARCACAO_DESATIVAR_V6,
    SQL_TRIGGER_OWNER_DESATIVAR_PETS_V6,
    SQL_TRIGGER_PET_ATIVAR_OWNER_V6,
    SQL_TRIGGER_PET_DESATIVAR_LIMPAR_REMARCACAO_V6,
    SQL_TRIGGER_ULTIMA_VISITA_V6,
  ],
};
