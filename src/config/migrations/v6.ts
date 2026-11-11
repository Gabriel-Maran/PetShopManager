// Versão 6 do esquema: a integridade fica no próprio banco (DADOS-4).
//
// Editada antes de chegar a qualquer aparelho (decisões do Gabriel de 2026-11-10); daqui em diante,
// congelada: uma versão publicada não muda mais.
//
// - Os flags só aceitam 0 ou 1, o porte só os quatro do app e os horários só "HH:MM", de 00:00 a 23:59
//   (CHECK). O horário padrão do pet passa a ser NOT NULL, como a hora do agendamento (PR #49). Os
//   valores em dinheiro do pacote e do agendamento não aceitam negativo.
// - O serviço (do pet e do agendamento) e a forma de pagamento passam a ser gravados pelo id, com chave
//   estrangeira, no lugar do texto. O agendamento guarda também o nome da época (servico_nome e
//   tipo_pgto_nome): renomear um item da lista não muda o histórico, e o relatório de um mês fechado
//   continua mostrando o que foi cobrado. A forma de pagamento nula é "não informada".
// - As listas ganham o is_ativo: o nome que não estava na lista fica oculto, para o formulário não
//   oferecê-lo, mas o histórico continua mostrando.
// - Sai o idx_appointments_pet_id, que repetia o começo do idx_appointments_pet_data e do
//   idx_appointments_auto_pendentes.
//
// O dado antigo que violaria um CHECK é corrigido na cópia, pela regra que o app já usa: flag diferente
// de zero é ligado (os builders), horário vazio é "00:00" (versão 5) e porte vazio é o "MEDIO" do
// formulário. O serviço padrão do pet também é um valor do formulário, que só oferece os três de
// TipoServico: o pet com outro serviço passa a apontar para o "Banho". Quando a correção joga fora um
// valor que alguém digitou (porte que não é porte, serviço padrão fora dos três, horário fora do
// formato, dinheiro negativo), o original vai para o fim da observação do pet ou do agendamento,
// numa nota, e a observação que já existia fica intacta. O nome de serviço ou de pagamento que algum
// agendamento usa e que não estiver na lista entra nela, oculto, para nenhum agendamento perder o que
// tinha. O pet guarda a configuração de hoje, e não histórico, por isso o serviço dele não vira nome
// gravado nem item oculto. Um backup antigo passa por esta mesma migração.
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

/** O horário que a migração aproveita: "HH:MM", ou "H:MM", que ganha o zero à esquerda. */
const isRecoverableTime = (value: string) => `(${isHourMinute(value)} OR ${value} GLOB '[0-9]:[0-5][0-9]')`;

/** '09:30' fica; '9:30' vira '09:30'; nulo, vazio ou fora do formato vira '00:00', o "sem horário". */
function timeFrom(column: string): string {
  const value = `trim(${column})`;
  return `CASE
    WHEN ${isHourMinute(value)} THEN ${value}
    WHEN ${value} GLOB '[0-9]:[0-5][0-9]' THEN '0' || ${value}
    ELSE '00:00'
  END`;
}

/** Há um horário digitado que a conversão joga fora (nulo e vazio são o "sem horário" e não perdem nada). */
const isTimeLost = (column: string) =>
  `(COALESCE(trim(${column}), '') <> '' AND NOT ${isRecoverableTime(`trim(${column})`)})`;

const PORTES = `('PEQUENO', 'MEDIO', 'GRANDE', 'GRANDAO')`;

/**
 * Em maio de 2026, o app gravou o rótulo do porte ("Pequeno", "Medio", "Grandão"), e não a chave. O
 * upper do SQLite só troca as letras sem acento, então os acentos saem à parte.
 */
const porteKey = (column: string) =>
  `replace(replace(replace(replace(upper(trim(${column})), 'é', 'E'), 'É', 'E'), 'ã', 'A'), 'Ã', 'A')`;

/** A chave do porte; o que mesmo assim não for um porte do app vira o "MEDIO", o padrão do formulário. */
function porteFrom(column: string): string {
  const key = porteKey(column);
  return `CASE WHEN ${key} IN ${PORTES} THEN ${key} ELSE 'MEDIO' END`;
}

/** Há um porte digitado que não é nenhum dos quatro (o vazio vira "MEDIO" sem perder nada). */
const isPorteLost = (column: string) =>
  `(COALESCE(trim(${column}), '') <> '' AND ${porteKey(column)} NOT IN ${PORTES})`;

const serviceIdOf = (name: string) => `(SELECT id FROM service_type WHERE servico = ${name})`;

/** Os serviços que o formulário do pet oferece (TipoServico): sempre na lista, ativos. */
const DEFAULT_SERVICES = ["Banho", "Banho e Tosa", "Banho e Higiênica"] as const;
const DEFAULT_SERVICES_SQL = `(${DEFAULT_SERVICES.map((name) => `'${name}'`).join(", ")})`;

/** O serviço padrão do pet que o formulário não oferece (o vazio vira "Banho" sem perder nada). */
const isPetServiceLost = (column: string) =>
  `(COALESCE(trim(${column}), '') <> '' AND trim(${column}) NOT IN ${DEFAULT_SERVICES_SQL})`;

// ── Notas com o valor antigo ──────────────────────────────────────────────

/** Até quantos caracteres do valor antigo entram na nota, para um texto enorme não encher a observação. */
const NOTE_VALUE_LENGTH = 40;

/** `<rótulo>: "<valor>".` quando `isLost`; nulo quando nada se perdeu. */
const noteWhen = (isLost: string, label: string, shownValue: string) =>
  `CASE WHEN ${isLost} THEN '${label}: "' || ${shownValue} || '".' END`;

const textNote = (isLost: string, label: string, column: string) =>
  noteWhen(isLost, label, `substr(trim(${column}), 1, ${NOTE_VALUE_LENGTH})`);

/** O dinheiro negativo em reais, como o app mostra ("-11,50"; -50 centavos é "-0,50"). */
const negativeMoneyNote = (label: string, column: string) =>
  noteWhen(`${column} < 0`, label, `printf('-%d,%02d', abs(${column}) / 100, abs(${column}) % 100)`);

/**
 * Põe as notas no fim da observação, depois de uma quebra de linha e separadas por espaço. A observação
 * que já existia fica como está; sem observação, fica só a nota; sem nota, nada muda.
 */
function withNotes(column: string, notes: readonly string[]): string {
  const joined = `trim(${notes.map((note) => `COALESCE(${note} || ' ', '')`).join(" || ")})`;
  return `CASE
    WHEN ${joined} = '' THEN ${column}
    WHEN COALESCE(${column}, '') = '' THEN ${joined}
    ELSE ${column} || char(10) || ${joined}
  END`;
}

/** Dinheiro negativo vira 0, o DEFAULT e o "sem valor" do app; o original fica na nota. */
const moneyFrom = (column: string) => `CASE WHEN ${column} < 0 THEN 0 ELSE ${column} END`;

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

// O item oculto (is_ativo = 0) não aparece nas listas do formulário, mas o agendamento antigo continua
// apontando para ele.
export const SQL_ADD_ACTIVE_FLAG_V6 = `
  ALTER TABLE service_type ADD COLUMN is_ativo INTEGER NOT NULL DEFAULT 1 CHECK (is_ativo IN (0, 1));
  ALTER TABLE payment_methods ADD COLUMN is_ativo INTEGER NOT NULL DEFAULT 1 CHECK (is_ativo IN (0, 1));
`;

// O agendamento passa a apontar para a forma de pagamento pelo id, achado pelo nome. Um nome repetido
// na lista deixaria a escolha ambígua; como nada apontava para o id antes desta versão, as cópias saem
// sem perder informação, e o nome passa a ser único, como o do serviço já era.
export const SQL_UNIQUE_PAYMENT_METHODS_V6 = `
  DELETE FROM payment_methods
  WHERE id NOT IN (SELECT MIN(id) FROM payment_methods GROUP BY tipo_pgto);
  CREATE UNIQUE INDEX idx_payment_methods_tipo_pgto ON payment_methods (tipo_pgto);
`;

// Os três serviços que o formulário do pet oferece (TipoServico) precisam estar na lista, ativos. Vem
// antes dos nomes desconhecidos: sem isso, um "Banho" que só existe no texto dos agendamentos entraria
// oculto.
export const SQL_ENSURE_DEFAULT_SERVICES_V6 = `
  INSERT INTO service_type (servico)
    SELECT column1 FROM (VALUES ${DEFAULT_SERVICES.map((name) => `('${name}')`).join(", ")})
    WHERE column1 NOT IN (SELECT servico FROM service_type);
`;

// O nome que algum agendamento usa e que não está na lista (gravado por uma versão antiga ou por um
// backup) entra nela, oculto, para o histórico continuar mostrando. O serviço padrão do pet fica de
// fora: ele aponta para um dos três (ver SQL_REBUILD_PETS_V6). O vazio também: no pagamento, ele e o
// "0" do DEFAULT antigo querem dizer "não informado".
export const SQL_KEEP_UNKNOWN_NAMES_V6 = `
  INSERT INTO service_type (servico, is_ativo)
    SELECT DISTINCT trim(servico), 0 FROM appointments
    WHERE trim(servico) <> '' AND trim(servico) NOT IN (SELECT servico FROM service_type);

  INSERT INTO payment_methods (tipo_pgto, is_ativo)
    SELECT DISTINCT trim(tipo_pgto), 0 FROM appointments
    WHERE trim(tipo_pgto) NOT IN ('', '0') AND trim(tipo_pgto) NOT IN (SELECT tipo_pgto FROM payment_methods);
`;

// ── Tabelas ───────────────────────────────────────────────────────────────
// As mesmas colunas da versão 3, na mesma ordem. Mudam os CHECKs, o NOT NULL do horário padrão e as
// colunas de serviço e de pagamento, que passam a guardar o id (e, no agendamento, o nome da época).

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

// Sem serviço, ou com um serviço fora dos três do formulário, o pet fica com o "Banho", o DEFAULT da
// coluna de texto. O porte, o serviço padrão, o horário padrão e o valor do pacote que a conversão joga
// fora vão para a observação.
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
    valor_pacote               INTEGER DEFAULT 0 CHECK (valor_pacote >= 0),
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
    observacoes: withNotes("observacoes", [
      textNote(isPorteLost("porte"), "Porte antigo", "porte"),
      textNote(isPetServiceLost("servico_padrao"), "Serviço padrão antigo", "servico_padrao"),
      textNote(isTimeLost("horario_padrao"), "Horário padrão antigo", "horario_padrao"),
      negativeMoneyNote("Valor do pacote antigo", "valor_pacote"),
    ]),
    servico_padrao_id: serviceIdOf(
      `CASE WHEN trim(pets.servico_padrao) IN ${DEFAULT_SERVICES_SQL} THEN trim(pets.servico_padrao) ELSE 'Banho' END`,
    ),
    remarcacao_ativa: flagFrom("remarcacao_ativa"),
    valor_pacote: moneyFrom("valor_pacote"),
    horario_padrao: timeFrom("horario_padrao"),
    is_ativo: flagFrom("is_ativo"),
  },
);

// Roda depois dos pets: um agendamento sem nome de serviço fica com o serviço padrão do pet e, se nem
// o pet existir, com o "Banho". O nome do serviço e o da forma de pagamento saem da lista, pelo id
// achado, e valem como o nome da época. O horário e o valor que a conversão joga fora vão para a
// observação.
const APPOINTMENT_SERVICE_ID = `COALESCE(
      ${serviceIdOf("trim(appointments.servico)")},
      (SELECT servico_padrao_id FROM pets WHERE pets.id = appointments.pet_id),
      ${serviceIdOf("'Banho'")}
    )`;

export const SQL_REBUILD_APPOINTMENTS_V6 = rebuildTable(
  "appointments",
  `
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id         INTEGER NOT NULL,
    servico_id     INTEGER NOT NULL,
    servico_nome   TEXT    NOT NULL CHECK (trim(servico_nome) <> ''),
    data           TEXT    NOT NULL,
    hora           TEXT    NOT NULL DEFAULT '00:00' CHECK ${isHourMinute("hora")},
    dia_semana     INTEGER GENERATED ALWAYS AS (CAST(strftime('%w', data) AS INTEGER)) VIRTUAL,
    entregar_pet   INTEGER NOT NULL DEFAULT 0 CHECK (entregar_pet IN (0, 1)),
    concluido      INTEGER NOT NULL DEFAULT 0 CHECK (concluido IN (0, 1)),
    observacao     TEXT,
    is_auto_agen   INTEGER NOT NULL DEFAULT 0 CHECK (is_auto_agen IN (0, 1)),
    valor          INTEGER NOT NULL DEFAULT 0 CHECK (valor >= 0),
    tipo_pgto_id   INTEGER,
    tipo_pgto_nome TEXT,
    ta_pago        INTEGER NOT NULL DEFAULT 0 CHECK (ta_pago IN (0, 1)),
    criado_em      TEXT    NOT NULL DEFAULT (${TODAY}),
    CHECK ((tipo_pgto_id IS NULL) = (tipo_pgto_nome IS NULL)),
    FOREIGN KEY (pet_id)       REFERENCES pets(id)            ON DELETE CASCADE,
    FOREIGN KEY (servico_id)   REFERENCES service_type(id)    ON DELETE RESTRICT,
    FOREIGN KEY (tipo_pgto_id) REFERENCES payment_methods(id) ON DELETE RESTRICT
  `,
  [
    "id", "pet_id", "servico_id", "servico_nome", "data", "hora", "entregar_pet", "concluido",
    "observacao", "is_auto_agen", "valor", "tipo_pgto_id", "tipo_pgto_nome", "ta_pago", "criado_em",
  ],
  {
    servico_id: APPOINTMENT_SERVICE_ID,
    servico_nome: `(SELECT servico FROM service_type WHERE id = ${APPOINTMENT_SERVICE_ID})`,
    hora: timeFrom("hora"),
    entregar_pet: flagFrom("entregar_pet"),
    concluido: flagFrom("concluido"),
    observacao: withNotes("observacao", [
      textNote(isTimeLost("hora"), "Horário antigo", "hora"),
      negativeMoneyNote("Valor antigo", "valor"),
    ]),
    is_auto_agen: flagFrom("is_auto_agen"),
    valor: moneyFrom("valor"),
    tipo_pgto_id: `(SELECT id FROM payment_methods WHERE tipo_pgto = trim(appointments.tipo_pgto))`,
    tipo_pgto_nome: `(SELECT tipo_pgto FROM payment_methods WHERE tipo_pgto = trim(appointments.tipo_pgto))`,
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
    SQL_ADD_ACTIVE_FLAG_V6,
    SQL_UNIQUE_PAYMENT_METHODS_V6,
    SQL_ENSURE_DEFAULT_SERVICES_V6,
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
