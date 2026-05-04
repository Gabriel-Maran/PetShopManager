import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

// ─── Período máximo de remarcação automática ──────────────────────────────────
// Troque o valor conforme necessário:
//   '+365 days' = 1 ano | '+180 days' = 6 meses | '+30 days' = 1 mês
const PERIODO_REMARCACAO = "+212 days";
// ─────────────────────────────────────────────────────────────────────────────

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync("petshop.db");
    await db.execAsync(`PRAGMA journal_mode = WAL;`);
  }
  return db;
}

// Todo -> Verificaçãode pacotes(quinzenal e mensal)
export async function initDatabase(): Promise<void> {
  const db = await getDatabase();

  /*
  -- ── RESET DE DESENVOLVIMENTO ─────────────────────────────────────────────
  -- Descomente para recriar o banco do zero.
  -- IMPORTANTE: mover para ANTES do primeiro CREATE TABLE ao usar.

    DROP TRIGGER IF EXISTS trg_pet_remarcacao_desativar;
    DROP TRIGGER IF EXISTS trg_pet_remarcacao_ativar;
    DROP TRIGGER IF EXISTS trg_pet_remarcacao_insert;
    DROP TRIGGER IF EXISTS trg_remarcacao_automatica;
    DROP TRIGGER IF EXISTS trg_ultimo_banho;
    DROP INDEX IF EXISTS idx_appointments_data_concluido;
    DROP INDEX IF EXISTS idx_appointments_pet_data;
    DROP INDEX IF EXISTS idx_appointments_pet_id;
    DROP INDEX IF EXISTS idx_pets_dono_id;
    DROP TABLE IF EXISTS appointments;
    DROP TABLE IF EXISTS pets;
    DROP TABLE IF EXISTS owners;
  */

  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    -- ── Tabelas ──────────────────────────────────────────────────────────────

    CREATE TABLE IF NOT EXISTS owners (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nome      TEXT    NOT NULL,
      telefone  TEXT    NOT NULL,
      email     TEXT,
      endereco  TEXT,
      criado_em INTEGER NOT NULL DEFAULT (strftime('%Y%m%d', 'now'))
    );

    CREATE TABLE IF NOT EXISTS pets (
      id                           INTEGER PRIMARY KEY AUTOINCREMENT,
      nome                         TEXT    NOT NULL,
      especie                      TEXT    NOT NULL,
      porte                        TEXT    NOT NULL,
      raca                         TEXT,
      observacoes                  TEXT,
      dono_id                      INTEGER NOT NULL,
      servico_padrao               TEXT    NOT NULL DEFAULT 'Banho',
      remarcacao_ativa             INTEGER NOT NULL DEFAULT 0,
      remarcacao_gap_dias          INTEGER CHECK (remarcacao_gap_dias <= 60),
      current_ultimo_banho_data    INTEGER,
      ultimo_banho_data_automatico INTEGER,
      criado_em                    INTEGER NOT NULL DEFAULT (strftime('%Y%m%d', 'now')),
      FOREIGN KEY (dono_id) REFERENCES owners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id       INTEGER NOT NULL,
      servico      TEXT    NOT NULL,
      data         INTEGER NOT NULL,
      entregar_pet INTEGER NOT NULL DEFAULT 0,
      concluido    INTEGER NOT NULL DEFAULT 0,
      observacao   TEXT,
      criado_em    INTEGER NOT NULL DEFAULT (strftime('%Y%m%d', 'now')),
      FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
    );

    -- ── Indexes ──────────────────────────────────────────────────────────────

    -- Busca de pets por dono (tela de cadastros, join owners → pets)
    CREATE INDEX IF NOT EXISTS idx_pets_dono_id
      ON pets (dono_id);

    -- Busca de agendamentos por pet (perfil do pet, histórico)
    CREATE INDEX IF NOT EXISTS idx_appointments_pet_id
      ON appointments (pet_id);

    -- Busca de agendamentos por pet + data (calendário filtrando por pet)
    CREATE INDEX IF NOT EXISTS idx_appointments_pet_data
      ON appointments (pet_id, data);

    -- Busca de agendamentos por data + status (tela do calendário)
    CREATE INDEX IF NOT EXISTS idx_appointments_data_concluido
      ON appointments (data, concluido);

    -- ── Trigger: atualiza current_ultimo_banho_data ao CONCLUIR agendamento ──
    -- Só registra quando o banho realmente aconteceu.

    CREATE TRIGGER IF NOT EXISTS trg_ultimo_banho
    AFTER UPDATE OF concluido ON appointments
    FOR EACH ROW
    WHEN NEW.concluido = 1
      AND NEW.servico IN ('Banho', 'Banho e Tosa')
    BEGIN
      UPDATE pets
      SET current_ultimo_banho_data = NEW.data
      WHERE id = NEW.pet_id;
    END;

    -- ── Trigger: cria próximo agendamento ao concluir (remarcação por gap) ───
    -- Cria 1 novo agendamento = data concluída + remarcacao_gap_dias.

    CREATE TRIGGER IF NOT EXISTS trg_remarcacao_automatica
    AFTER UPDATE OF concluido ON appointments
    FOR EACH ROW
    WHEN NEW.concluido = 1
    BEGIN
      INSERT INTO appointments (pet_id, servico, data, entregar_pet, observacao)
      SELECT
        NEW.pet_id,
        NEW.servico,
        CAST(strftime('%Y%m%d', date(
          substr(CAST(NEW.data AS TEXT), 1, 4) || '-' ||
          substr(CAST(NEW.data AS TEXT), 5, 2) || '-' ||
          substr(CAST(NEW.data AS TEXT), 7, 2),
          '+' || p.remarcacao_gap_dias || ' days'
        )) AS INTEGER),
        NEW.entregar_pet,
        NEW.observacao
      FROM pets p
      WHERE p.id = NEW.pet_id
        AND p.remarcacao_ativa = 1
        AND p.remarcacao_gap_dias IS NOT NULL;
    END;

    -- ── Trigger: cria agendamentos em série ao INSERIR pet com remarcação ────
    -- Cria N agendamentos espaçados por remarcacao_gap_dias dentro do período.

    CREATE TRIGGER IF NOT EXISTS trg_pet_remarcacao_insert
    AFTER INSERT ON pets
    FOR EACH ROW
    WHEN NEW.remarcacao_ativa = 1 AND NEW.remarcacao_gap_dias IS NOT NULL
    BEGIN
      INSERT INTO appointments (pet_id, servico, data, entregar_pet)
      WITH RECURSIVE agenda(data_int) AS (
        SELECT CAST(strftime('%Y%m%d', date('now', '+' || NEW.remarcacao_gap_dias || ' days')) AS INTEGER)
        UNION ALL
        SELECT CAST(strftime('%Y%m%d', date(
          substr(CAST(data_int AS TEXT), 1, 4) || '-' ||
          substr(CAST(data_int AS TEXT), 5, 2) || '-' ||
          substr(CAST(data_int AS TEXT), 7, 2),
          '+' || NEW.remarcacao_gap_dias || ' days'
        )) AS INTEGER)
        FROM agenda
        WHERE data_int < CAST(strftime('%Y%m%d', date('now', '${PERIODO_REMARCACAO}')) AS INTEGER)
      )
      SELECT NEW.id, NEW.servico_padrao, data_int, 0 FROM agenda;
    END;

    -- ── Trigger: cria agendamentos em série ao ATIVAR remarcação (0 → 1) ────

    CREATE TRIGGER IF NOT EXISTS trg_pet_remarcacao_ativar
    AFTER UPDATE OF remarcacao_ativa ON pets
    FOR EACH ROW
    WHEN OLD.remarcacao_ativa = 0 AND NEW.remarcacao_ativa = 1
      AND NEW.remarcacao_gap_dias IS NOT NULL
    BEGIN
      INSERT INTO appointments (pet_id, servico, data, entregar_pet)
      WITH RECURSIVE agenda(data_int) AS (
        SELECT CAST(strftime('%Y%m%d', date('now', '+' || NEW.remarcacao_gap_dias || ' days')) AS INTEGER)
        UNION ALL
        SELECT CAST(strftime('%Y%m%d', date(
          substr(CAST(data_int AS TEXT), 1, 4) || '-' ||
          substr(CAST(data_int AS TEXT), 5, 2) || '-' ||
          substr(CAST(data_int AS TEXT), 7, 2),
          '+' || NEW.remarcacao_gap_dias || ' days'
        )) AS INTEGER)
        FROM agenda
        WHERE data_int < CAST(strftime('%Y%m%d', date('now', '${PERIODO_REMARCACAO}')) AS INTEGER)
      )
      SELECT NEW.id, NEW.servico_padrao, data_int, 0 FROM agenda;
    END;

    -- ── Trigger: remove agendamentos futuros ao DESATIVAR remarcação (1 → 0) ─
    -- Remove apenas agendamentos não concluídos a partir de amanhã.

    CREATE TRIGGER IF NOT EXISTS trg_pet_remarcacao_desativar
    AFTER UPDATE OF remarcacao_ativa ON pets
    FOR EACH ROW
    WHEN OLD.remarcacao_ativa = 1 AND NEW.remarcacao_ativa = 0
    BEGIN
      DELETE FROM appointments
      WHERE pet_id = NEW.id
        AND concluido = 0
        AND data > CAST(strftime('%Y%m%d', 'now') AS INTEGER);
    END;
  `);
}
