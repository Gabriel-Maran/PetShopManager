// Versão 3 do esquema: dinheiro em centavos inteiros (DADOS-2), datas em texto "AAAA-MM-DD" (DADOS-3)
// e o relógio dos triggers no fuso do aparelho (o resto do BUG-7). Não mude este arquivo: uma versão
// publicada não muda mais.
//
// O SQLite não troca o tipo de uma coluna. O caminho que ele indica é criar a tabela nova, copiar os
// dados convertidos, apagar a antiga e renomear a nova. As chaves estrangeiras ficam desligadas
// durante as migrações (migrator.ts), então apagar a tabela antiga não leva as filhas junto.
//
// Como a versão 2, esta traz o texto inteiro do que cria, sem reaproveitar as constantes das versões
// anteriores (ver decisoes.md). Só o período da remarcação vem da versão 1.
import type { Migration } from "../migrator";
import { PERIODO_REMARCACAO } from "./v1.ts";

// ── Conversão dos dados ───────────────────────────────────────────────────

/** 20261108 → '2026-11-08'. Nulo continua nulo, e o que não tiver 8 dígitos fica como está. */
function isoFromNumber(column: string): string {
  return `CASE WHEN ${column} GLOB '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
    THEN substr(${column}, 1, 4) || '-' || substr(${column}, 5, 2) || '-' || substr(${column}, 7, 2)
    ELSE ${column}
  END`;
}

/**
 * Texto do valor → centavos: '12,50' → 1250, '12,5' → 1250, '12' → 1200, '' → 0. Nulo continua nulo.
 * As máscaras antigas só deixavam dígitos e vírgula; o ponto vira vírgula para cobrir um valor que
 * tenha sido gravado como número. A conta é feita no texto, sem ponto flutuante, e o que passar de
 * duas casas é descartado.
 */
function centsFromText(column: string): string {
  const text = `replace(trim(${column}), '.', ',')`;
  // Posição da vírgula; sem vírgula, logo depois do fim do texto.
  const comma = `instr(${text} || ',', ',')`;
  const reais = `CAST(substr(${text}, 1, ${comma} - 1) AS INTEGER)`;
  const cents = `CAST(substr(substr(${text}, ${comma} + 1) || '00', 1, 2) AS INTEGER)`;
  return `CASE WHEN ${column} IS NULL THEN NULL ELSE ${reais} * 100 + ${cents} END`;
}

/**
 * Troca a tabela pela versão nova, com as colunas copiadas e as de `conversions` convertidas. A
 * contagem de ids (sqlite_sequence) passa para a tabela nova, para um id apagado não voltar a ser usado.
 */
function rebuildTable(
  table: string,
  definition: string,
  columns: readonly string[],
  conversions: Readonly<Record<string, string>>,
): string {
  const next = `${table}_v3`;
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
// outra que está sendo trocada.
export const SQL_DROP_TRIGGERS_V3 = `
  DROP TRIGGER IF EXISTS trg_ultima_visita;
  DROP TRIGGER IF EXISTS trg_remarcacao_automatica;
  DROP TRIGGER IF EXISTS trg_pet_remarcacao_insert;
  DROP TRIGGER IF EXISTS trg_pet_remarcacao_ativar;
  DROP TRIGGER IF EXISTS trg_pet_remarcacao_desativar;
  DROP TRIGGER IF EXISTS trg_owner_desativar_pets;
  DROP TRIGGER IF EXISTS trg_pet_ativar_owner;
  DROP TRIGGER IF EXISTS trg_pet_desativar_limpar_remarcacao;
`;

// ── Tabelas ───────────────────────────────────────────────────────────────
// As mesmas colunas da versão 1. Mudam só os tipos: dinheiro em centavos (INTEGER) e datas em texto
// (TEXT), com o criado_em no dia do aparelho.

const TODAY = `date('now', 'localtime')`;

export const SQL_REBUILD_OWNERS_V3 = rebuildTable(
  "owners",
  `
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    nome             TEXT    NOT NULL,
    nome_normalizado TEXT    NOT NULL DEFAULT '',
    telefone         TEXT    NOT NULL,
    email            TEXT,
    endereco         TEXT,
    is_ativo         INTEGER NOT NULL DEFAULT 1,
    criado_em        TEXT    NOT NULL DEFAULT (${TODAY})
  `,
  ["id", "nome", "nome_normalizado", "telefone", "email", "endereco", "is_ativo", "criado_em"],
  { criado_em: isoFromNumber("criado_em") },
);

export const SQL_REBUILD_PETS_V3 = rebuildTable(
  "pets",
  `
    id                         INTEGER PRIMARY KEY AUTOINCREMENT,
    nome                       TEXT    NOT NULL,
    nome_normalizado           TEXT    NOT NULL DEFAULT '',
    especie                    INTEGER NOT NULL,
    porte                      TEXT    NOT NULL,
    raca                       INTEGER NOT NULL,
    observacoes                TEXT,
    dono_id                    INTEGER NOT NULL,
    servico_padrao             TEXT    NOT NULL DEFAULT 'Banho',
    remarcacao_ativa           INTEGER NOT NULL DEFAULT 0,
    pacote_remarcacao          INTEGER CHECK (pacote_remarcacao IN (2, 4)),
    valor_pacote               INTEGER DEFAULT 0,
    data_inicio_pacote         TEXT,
    horario_padrao             TEXT DEFAULT '00:00',
    current_ultima_visita_data TEXT,
    ultimo_visita_data_auto    TEXT,
    is_ativo                   INTEGER NOT NULL DEFAULT 1,
    criado_em                  TEXT    NOT NULL DEFAULT (${TODAY}),
    FOREIGN KEY (dono_id)  REFERENCES owners(id)  ON DELETE CASCADE,
    FOREIGN KEY (especie)  REFERENCES species(id) ON DELETE RESTRICT,
    FOREIGN KEY (raca)     REFERENCES race(id)    ON DELETE RESTRICT
  `,
  [
    "id", "nome", "nome_normalizado", "especie", "porte", "raca", "observacoes", "dono_id",
    "servico_padrao", "remarcacao_ativa", "pacote_remarcacao", "valor_pacote", "data_inicio_pacote",
    "horario_padrao", "current_ultima_visita_data", "ultimo_visita_data_auto", "is_ativo", "criado_em",
  ],
  {
    valor_pacote: centsFromText("valor_pacote"),
    data_inicio_pacote: isoFromNumber("data_inicio_pacote"),
    current_ultima_visita_data: isoFromNumber("current_ultima_visita_data"),
    ultimo_visita_data_auto: isoFromNumber("ultimo_visita_data_auto"),
    criado_em: isoFromNumber("criado_em"),
  },
);

export const SQL_REBUILD_APPOINTMENTS_V3 = rebuildTable(
  "appointments",
  `
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id       INTEGER NOT NULL,
    servico      TEXT    NOT NULL,
    data         TEXT    NOT NULL,
    hora         TEXT    NOT NULL DEFAULT '00:00',
    dia_semana   INTEGER GENERATED ALWAYS AS (CAST(strftime('%w', data) AS INTEGER)) VIRTUAL,
    entregar_pet INTEGER NOT NULL DEFAULT 0,
    concluido    INTEGER NOT NULL DEFAULT 0,
    observacao   TEXT,
    is_auto_agen INTEGER NOT NULL DEFAULT 0,
    valor        INTEGER NOT NULL DEFAULT 0,
    tipo_pgto    TEXT    NOT NULL DEFAULT 0,
    ta_pago      INTEGER NOT NULL DEFAULT 0,
    criado_em    TEXT    NOT NULL DEFAULT (${TODAY}),
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
  `,
  [
    "id", "pet_id", "servico", "data", "hora", "entregar_pet", "concluido", "observacao",
    "is_auto_agen", "valor", "tipo_pgto", "ta_pago", "criado_em",
  ],
  {
    data: isoFromNumber("data"),
    valor: centsFromText("valor"),
    criado_em: isoFromNumber("criado_em"),
  },
);

// ── Índices ───────────────────────────────────────────────────────────────
// Os mesmos da versão 1, que somem junto com as tabelas antigas.

export const SQL_CREATE_INDEXES_V3 = `
  CREATE INDEX idx_pets_dono_id ON pets (dono_id);
  CREATE INDEX idx_appointments_pet_id ON appointments (pet_id);
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

// ── Peças dos triggers ────────────────────────────────────────────────────
// Com a data em texto, as contas usam as funções de data do SQLite direto, sem montar o texto com
// substr. O "hoje" e o fim do período seguem o fuso do aparelho ('localtime').

const HORIZON = `date('now', 'localtime', '${PERIODO_REMARCACAO}')`;
const NOW_TIME = `strftime('%H:%M', 'now', 'localtime')`;

const monthOf = (date: string) => `strftime('%Y-%m', ${date})`;
const weekdayOf = (date: string) => `CAST(strftime('%w', ${date}) AS INTEGER)`;

/** Pacote 2: a cada 14 dias. Pacote 4: a cada 7. */
const nextVisit = (date: string, pacote: string) =>
  `date(${date}, '+' || CASE ${pacote} WHEN 2 THEN 14 ELSE 7 END || ' days')`;

/** A primeira data do mês seguinte ao de `date` que cai no dia da semana `weekday` (0 = domingo). */
function sameWeekdayNextMonth(date: string, weekday: string): string {
  const firstDay = `date(${date}, 'start of month', '+1 month')`;
  return `date(${firstDay}, '+' || ((${weekday} - ${weekdayOf(firstDay)} + 7) % 7) || ' days')`;
}

/**
 * Valor de um atendimento do pacote, em centavos. A sobra da divisão fica com os primeiros do mês
 * (decisão do Gabriel em 2026-11-08): R$ 100,03 em 4 dá 25,01 nos três primeiros e 25,00 no quarto.
 */
function visitCents(packageCents: string, pacote: string, positionInMonth: string): string {
  const total = `COALESCE(${packageCents}, 0)`;
  return `(${total} / ${pacote} + (${positionInMonth} <= ${total} % ${pacote}))`;
}

/** Aponta o pet para o último automático em aberto. */
const updateLastAutoSql = (petId: string) => `
    UPDATE pets
    SET ultimo_visita_data_auto = (
      SELECT MAX(data)
      FROM appointments
      WHERE pet_id = ${petId}
        AND is_auto_agen = 1
        AND concluido = 0
    )
    WHERE id = ${petId}`;

// A agenda do pacote, da data de início até o fim do período: a cada 7 ou 14 dias, até o limite do
// pacote no mês. Atingido o limite, pula para o mês seguinte, no dia da semana do início. A
// posicao_no_mes conta os atendimentos do mês, para a sobra de centavos ir para os primeiros.
const PACKAGE_AGENDA = `
    WITH RECURSIVE agenda(dia, posicao_no_mes, dia_semana_base) AS (
      SELECT inicio, 1, ${weekdayOf("inicio")}
      FROM (SELECT COALESCE(NEW.data_inicio_pacote, ${TODAY}) AS inicio)

      UNION ALL

      SELECT
        CASE WHEN posicao_no_mes >= NEW.pacote_remarcacao
          THEN ${sameWeekdayNextMonth("dia", "dia_semana_base")}
          ELSE ${nextVisit("dia", "NEW.pacote_remarcacao")}
        END,
        CASE
          WHEN posicao_no_mes >= NEW.pacote_remarcacao THEN 1
          WHEN ${monthOf(nextVisit("dia", "NEW.pacote_remarcacao"))} <> ${monthOf("dia")} THEN 1
          ELSE posicao_no_mes + 1
        END,
        dia_semana_base
      FROM agenda
      WHERE dia < ${HORIZON}
    )`;

const PACKAGE_VISIT_CENTS = visitCents("NEW.valor_pacote", "NEW.pacote_remarcacao", "posicao_no_mes");

// ── Triggers ──────────────────────────────────────────────────────────────
// A mesma regra das versões 1 e 2, com as datas em texto, os valores em centavos e o relógio do
// aparelho. Os três que não fazem conta com data nem valor têm o mesmo texto de antes.

// BUG-3, como na versão 2: só a passagem de pendente para concluído grava a última visita.
export const SQL_TRIGGER_ULTIMA_VISITA_V3 = `
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

// Desativar o dono desativa os pets dele.
export const SQL_TRIGGER_OWNER_DESATIVAR_PETS_V3 = `
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
export const SQL_TRIGGER_PET_ATIVAR_OWNER_V3 = `
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

// Ao concluir um automático, cria o próximo depois do último da agenda: soma o intervalo do pacote
// ou, se o mês já tem o limite de pendentes, pula para o mês seguinte no dia da semana do concluído.
export const SQL_TRIGGER_REMARCACAO_AUTOMATICA_V3 = `
  CREATE TRIGGER trg_remarcacao_automatica
  AFTER UPDATE OF concluido ON appointments
  FOR EACH ROW
  WHEN OLD.concluido = 0
    AND NEW.concluido = 1
    AND NEW.is_auto_agen = 1
  BEGIN
    INSERT INTO appointments (pet_id, servico, data, hora, entregar_pet, observacao, is_auto_agen, valor)
    SELECT
      NEW.pet_id,
      NEW.servico,
      proxima.dia,
      proxima.horario_padrao,
      NEW.entregar_pet,
      NEW.observacao,
      1,
      ${visitCents(
        "proxima.valor_pacote",
        "proxima.pacote_remarcacao",
        `1 + (
          SELECT COUNT(*)
          FROM appointments a
          WHERE a.pet_id = NEW.pet_id
            AND a.is_auto_agen = 1
            AND ${monthOf("a.data")} = ${monthOf("proxima.dia")}
        )`,
      )}
    FROM (
      SELECT
        p.horario_padrao,
        p.valor_pacote,
        p.pacote_remarcacao,
        CASE
          WHEN (
            SELECT COUNT(*)
            FROM appointments a
            WHERE a.pet_id = NEW.pet_id
              AND a.is_auto_agen = 1
              AND a.concluido = 0
              AND ${monthOf("a.data")} = ${monthOf("p.base")}
          ) >= p.pacote_remarcacao
            THEN ${sameWeekdayNextMonth("p.base", weekdayOf("NEW.data"))}
          ELSE ${nextVisit("p.base", "p.pacote_remarcacao")}
        END AS dia
      FROM (
        SELECT pets.*, COALESCE(pets.ultimo_visita_data_auto, NEW.data) AS base
        FROM pets
        WHERE pets.id = NEW.pet_id
          AND pets.is_ativo = 1
          AND pets.remarcacao_ativa = 1
          AND pets.pacote_remarcacao IS NOT NULL
      ) AS p
    ) AS proxima;

    ${updateLastAutoSql("NEW.pet_id")}
      AND is_ativo = 1
      AND remarcacao_ativa = 1;
  END;
`;

// Ao cadastrar um pet com pacote, gera a agenda desde a data de início. O que já passou entra como
// manual pendente, e o resto como automático.
export const SQL_TRIGGER_PET_REMARCACAO_INSERT_V3 = `
  CREATE TRIGGER trg_pet_remarcacao_insert
  AFTER INSERT ON pets
  FOR EACH ROW
  WHEN NEW.remarcacao_ativa = 1 AND NEW.pacote_remarcacao IS NOT NULL
  BEGIN
    INSERT INTO appointments (pet_id, servico, data, hora, entregar_pet, is_auto_agen, valor)
    ${PACKAGE_AGENDA}
    SELECT
      NEW.id,
      NEW.servico_padrao,
      dia,
      NEW.horario_padrao,
      0,
      CASE
        WHEN dia < ${TODAY} OR (dia = ${TODAY} AND NEW.horario_padrao < ${NOW_TIME}) THEN 0
        ELSE 1
      END,
      ${PACKAGE_VISIT_CENTS}
    FROM agenda;

    ${updateLastAutoSql("NEW.id")};
  END;
`;

// BUG-4, como na versão 2: a agenda só é refeita quando muda de fato um campo que entra nela. Só os
// automáticos pendentes de hoje em diante são apagados e gerados de novo.
export const SQL_TRIGGER_PET_REMARCACAO_ATIVAR_V3 = `
  CREATE TRIGGER trg_pet_remarcacao_ativar
  AFTER UPDATE OF remarcacao_ativa, pacote_remarcacao, data_inicio_pacote, is_ativo,
    horario_padrao, servico_padrao, valor_pacote ON pets
  FOR EACH ROW
  WHEN NEW.remarcacao_ativa = 1
    AND NEW.pacote_remarcacao IS NOT NULL
    AND NEW.is_ativo = 1
    AND (
      OLD.remarcacao_ativa IS NOT NEW.remarcacao_ativa
      OR OLD.pacote_remarcacao IS NOT NEW.pacote_remarcacao
      OR OLD.data_inicio_pacote IS NOT NEW.data_inicio_pacote
      OR OLD.is_ativo IS NOT NEW.is_ativo
      OR OLD.horario_padrao IS NOT NEW.horario_padrao
      OR OLD.servico_padrao IS NOT NEW.servico_padrao
      OR OLD.valor_pacote IS NOT NEW.valor_pacote
    )
  BEGIN
    DELETE FROM appointments
    WHERE pet_id = NEW.id
      AND is_auto_agen = 1
      AND concluido = 0
      AND data >= ${TODAY};

    INSERT INTO appointments (pet_id, servico, data, hora, entregar_pet, is_auto_agen, valor)
    ${PACKAGE_AGENDA}
    SELECT
      NEW.id,
      NEW.servico_padrao,
      dia,
      NEW.horario_padrao,
      0,
      1,
      ${PACKAGE_VISIT_CENTS}
    FROM agenda
    WHERE dia >= ${TODAY}
      AND NOT EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.pet_id = NEW.id
          AND a.data = agenda.dia
          AND a.concluido = 1
      );

    ${updateLastAutoSql("NEW.id")};
  END;
`;

// Ao desligar a remarcação, apaga os automáticos pendentes a partir de amanhã.
export const SQL_TRIGGER_PET_REMARCACAO_DESATIVAR_V3 = `
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

// Ao desativar o pet, apaga os automáticos futuros e limpa o pacote.
export const SQL_TRIGGER_PET_DESATIVAR_LIMPAR_REMARCACAO_V3 = `
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

export const V3: Migration = {
  version: 3,
  statements: [
    SQL_DROP_TRIGGERS_V3,
    SQL_REBUILD_OWNERS_V3,
    SQL_REBUILD_PETS_V3,
    SQL_REBUILD_APPOINTMENTS_V3,
    SQL_CREATE_INDEXES_V3,
    // Na mesma ordem de criação da versão 2, que é a ordem em que o SQLite os dispara.
    SQL_TRIGGER_PET_REMARCACAO_INSERT_V3,
    SQL_TRIGGER_PET_REMARCACAO_DESATIVAR_V3,
    SQL_TRIGGER_OWNER_DESATIVAR_PETS_V3,
    SQL_TRIGGER_PET_ATIVAR_OWNER_V3,
    SQL_TRIGGER_PET_DESATIVAR_LIMPAR_REMARCACAO_V3,
    SQL_TRIGGER_ULTIMA_VISITA_V3,
    SQL_TRIGGER_REMARCACAO_AUTOMATICA_V3,
    SQL_TRIGGER_PET_REMARCACAO_ATIVAR_V3,
  ],
};
