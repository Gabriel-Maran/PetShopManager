import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

// ─── Período máximo de remarcação automática ──────────────────────────────────
// Troque o valor conforme necessário:
//   '+365 days' = 1 ano | '+180 days' = 6 meses | '+30 days' = 1 mês
const PERIODO_REMARCACAO = "+224 days";
// ─────────────────────────────────────────────────────────────────────────────

// ─── Gap por pacote ───────────────────────────────────────────────────────────
// Pacote 2 → a cada 14 dias (máx. 2 banhos/mês)
// Pacote 4 → a cada  7 dias (máx. 4 banhos/mês)
// ─────────────────────────────────────────────────────────────────────────────

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync("petshop.db");
    await db.execAsync(`PRAGMA journal_mode = WAL;`);
  }
  return db;
}

/* - Drops de triggers, index e tables
  //Cole lá em baixo, vai ter a indicação
    await db.execAsync(`
    DROP INDEX IF EXISTS idx_pets_dono_id;
    DROP INDEX IF EXISTS idx_appointments_pet_id;
    DROP INDEX IF EXISTS idx_appointments_pet_data;
    DROP INDEX IF EXISTS idx_appointments_data_concluido;
    DROP INDEX IF EXISTS idx_owners_nome_normalizado;
    DROP INDEX IF EXISTS idx_pets_nome_normalizado;
    DROP INDEX IF EXISTS idx_appointments_stats;
    DROP INDEX IF EXISTS idx_appointments_perf_hora;
    DROP INDEX IF EXISTS idx_appointments_auto_agen;
    DROP INDEX IF EXISTS idx_pets_ausentes;
    DROP INDEX IF EXISTS idx_appointments_mensal;
    DROP INDEX IF EXISTS idx_appointments_auto_pendentes;


    DROP TRIGGER IF EXISTS trg_ultima_visita;
    DROP TRIGGER IF EXISTS trg_remarcacao_automatica;
    DROP TRIGGER IF EXISTS trg_pet_remarcacao_insert;
    DROP TRIGGER IF EXISTS trg_pet_remarcacao_ativar;
    DROP TRIGGER IF EXISTS trg_pet_remarcacao_desativar;
    DROP TRIGGER IF EXISTS trg_owner_desativar_pets;
    DROP TRIGGER IF EXISTS trg_pet_ativar_owner;
    DROP TRIGGER IF EXISTS trg_pet_desativar_limpar_remarcacao;

    DROP TABLE IF EXISTS appointments;
    DROP TABLE IF EXISTS pets;
    DROP TABLE IF EXISTS owners;
    DROP TABLE IF EXISTS race;
    DROP TABLE IF EXISTS species;
    DROP TABLE IF EXISTS service_type;
    DROP TABLE IF EXISTS configs;
    DROP TABLE IF EXISTS payment_methods;`);
*/

export async function initDatabase(): Promise<void> {
  const db = await getDatabase();

  // ── Pragma ────────────────────────────────────────────────────────────────

  const SQL_PRAGMA = `
    PRAGMA foreign_keys = ON;
    PRAGMA recursive_triggers = ON;
  `;

  // ── Tabelas ───────────────────────────────────────────────────────────────

  const SQL_CREATE_TABLES = `
    CREATE TABLE IF NOT EXISTS configs (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      config   TEXT    NOT NULL UNIQUE,
      is_ativo INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS service_type (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      servico TEXT    NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS species (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT    NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS race (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      especie_id INTEGER NOT NULL,
      nome_raca  TEXT    NOT NULL,
      FOREIGN KEY (especie_id) REFERENCES species(id) ON DELETE CASCADE,
      UNIQUE (especie_id, nome_raca)
    );

    CREATE TABLE IF NOT EXISTS payment_methods (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo_pgto TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS owners (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      nome             TEXT    NOT NULL,
      nome_normalizado TEXT    NOT NULL DEFAULT '',
      telefone         TEXT    NOT NULL,
      email            TEXT,
      endereco         TEXT,
      is_ativo         INTEGER NOT NULL DEFAULT 1,
      criado_em        INTEGER NOT NULL DEFAULT (strftime('%Y%m%d', 'now'))
    );

    CREATE TABLE IF NOT EXISTS pets (
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
      data_inicio_pacote         INTEGER,
      current_ultima_visita_data INTEGER,
      ultimo_visita_data_auto    INTEGER,
      is_ativo                   INTEGER NOT NULL DEFAULT 1,
      criado_em                  INTEGER NOT NULL DEFAULT (strftime('%Y%m%d', 'now')),
      FOREIGN KEY (dono_id)  REFERENCES owners(id)  ON DELETE CASCADE,
      FOREIGN KEY (especie)  REFERENCES species(id) ON DELETE RESTRICT,
      FOREIGN KEY (raca)     REFERENCES race(id)    ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id       INTEGER NOT NULL,
      servico      TEXT    NOT NULL,
      data         INTEGER NOT NULL,
      hora         TEXT    NOT NULL DEFAULT '00:00',
      dia_semana INTEGER GENERATED ALWAYS AS (
        CAST(strftime('%w', 
          substr(data, 1, 4) || '-' || substr(data, 5, 2) || '-' || substr(data, 7, 2)
        ) AS INTEGER)
      ) VIRTUAL,
      entregar_pet INTEGER NOT NULL DEFAULT 0,
      concluido    INTEGER NOT NULL DEFAULT 0,
      observacao   TEXT,
      is_auto_agen INTEGER NOT NULL DEFAULT 0,
      valor        TEXT    NOT NULL DEFAULT '0,00',
      tipo_pgto    TEXT    NOT NULL DEFAULT 0,
      ta_pago      INTEGER NOT NULL DEFAULT 0,
      criado_em    INTEGER NOT NULL DEFAULT (strftime('%Y%m%d', 'now')),
      FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
    );
  `;

  // ── Índices ───────────────────────────────────────────────────────────────

  const SQL_CREATE_INDEXES = `
    CREATE INDEX IF NOT EXISTS idx_pets_dono_id
      ON pets (dono_id);

    CREATE INDEX IF NOT EXISTS idx_appointments_pet_id
      ON appointments (pet_id);

    CREATE INDEX IF NOT EXISTS idx_appointments_pet_data
      ON appointments (pet_id, data);

    CREATE INDEX IF NOT EXISTS idx_appointments_data_concluido
      ON appointments (data, concluido);

    CREATE INDEX IF NOT EXISTS idx_owners_nome_normalizado
      ON owners (nome_normalizado);

    CREATE INDEX IF NOT EXISTS idx_pets_nome_normalizado
      ON pets (nome_normalizado);

    CREATE INDEX IF NOT EXISTS idx_appointments_stats 
      ON appointments (concluido, dia_semana);
      
    CREATE INDEX IF NOT EXISTS idx_appointments_perf_hora 
      ON appointments (concluido, CAST(substr(hora, 1, 2) AS INTEGER));

    CREATE INDEX IF NOT EXISTS idx_appointments_auto_agen
      ON appointments (concluido, is_auto_agen);

    CREATE INDEX IF NOT EXISTS idx_pets_ausentes
      ON pets (remarcacao_ativa, is_ativo, current_ultima_visita_data);
    
    CREATE INDEX IF NOT EXISTS idx_appointments_mensal
      ON appointments (concluido, data);

    CREATE INDEX IF NOT EXISTS idx_appointments_auto_pendentes     
      ON appointments (pet_id, is_auto_agen, concluido, data);

  `;

  // ── Dados iniciais ────────────────────────────────────────────────────────

  const SQL_INSERTS = `
    INSERT OR IGNORE INTO configs (id, config, is_ativo) VALUES
      (1, 'Modo Escuro', 0);

    INSERT OR IGNORE INTO service_type (id, servico) VALUES
      (1, 'Banho'),
      (2, 'Banho e Tosa'),
      (3, 'Banho e Higiênica');

    INSERT OR IGNORE INTO payment_methods (id, tipo_pgto) VALUES
      (1, 'Cartão de Crédito'),
      (2, 'Cartão de Débito'),
      (3, 'PIX'),
      (4, 'Dinheiro');
      
    INSERT OR IGNORE INTO species (id, nome) VALUES
      (1, 'CAO'),
      (2, 'GATO'),
      (3, 'OUTRO');

    INSERT OR IGNORE INTO race (especie_id, nome_raca) VALUES
      (1, 'Vira-lata (SRD)'),
      (1, 'Shih Tzu'),
      (1, 'Yorkshire Terrier'),
      (1, 'Poodle'),
      (1, 'Spitz Alemão (Lulu)'),
      (1, 'Bulldog Francês'),
      (1, 'Pug'),
      (1, 'Golden Retriever'),
      (1, 'Labrador Retriever'),
      (1, 'Pinscher'),
      (1, 'Pitbull'),
      (1, 'Border Collie'),
      (1, 'Basset Hound'),
      (1, 'Chow Chow'),
      (2, 'Vira-lata (SRD)'),
      (2, 'Siamês'),
      (2, 'Persa'),
      (2, 'Angorá'),
      (2, 'Maine Coon'),
      (2, 'Bengal'),
      (2, 'Sphynx'),
      (2, 'Ragdoll'),
      (3, 'Não se aplica / SRD');
  `;

  // ── Triggers ──────────────────────────────────────────────────────────────
  // Atualiza current_ultima_visita_data ao concluir QUALQUER agendamento
  const SQL_TRIGGER_ULTIMA_VISITA = `
    CREATE TRIGGER IF NOT EXISTS trg_ultima_visita
    AFTER UPDATE OF concluido ON appointments
    FOR EACH ROW
    WHEN NEW.concluido = 1
    BEGIN
      UPDATE pets
      SET current_ultima_visita_data = NEW.data
      WHERE id = NEW.pet_id;
    END;
  `;

  // Ao concluir um agendamento AUTO:
  //   1. Calcula próxima data = ultimo_visita_data_auto + gap
  //   2. Só insere se o rate limit do mês alvo não foi atingido
  //   3. Atualiza ultimo_visita_data_auto para o novo MAX
  const SQL_TRIGGER_REMARCACAO_AUTOMATICA = `
    CREATE TRIGGER IF NOT EXISTS trg_remarcacao_automatica
    AFTER UPDATE OF concluido ON appointments
    FOR EACH ROW
    WHEN NEW.concluido = 1
      AND NEW.is_auto_agen = 1
    BEGIN
      INSERT INTO appointments (pet_id, servico, data, entregar_pet, observacao, is_auto_agen)
      SELECT
        NEW.pet_id,
        NEW.servico,
        CAST(strftime('%Y%m%d', date(
          COALESCE(
            substr(CAST(p.ultimo_visita_data_auto AS TEXT), 1, 4) || '-' ||
            substr(CAST(p.ultimo_visita_data_auto AS TEXT), 5, 2) || '-' ||
            substr(CAST(p.ultimo_visita_data_auto AS TEXT), 7, 2),
            -- fallback: usa a data do agendamento concluído
            substr(CAST(NEW.data AS TEXT), 1, 4) || '-' ||
            substr(CAST(NEW.data AS TEXT), 5, 2) || '-' ||
            substr(CAST(NEW.data AS TEXT), 7, 2)
          ),
          '+' || CASE p.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
        )) AS INTEGER),
        NEW.entregar_pet,
        NEW.observacao,
        1
      FROM pets p
      WHERE p.id = NEW.pet_id
        AND p.is_ativo = 1
        AND p.remarcacao_ativa = 1
        AND p.pacote_remarcacao IS NOT NULL
        -- Rate limit: conta pendentes no mês alvo
        AND (
          SELECT COUNT(*)
          FROM appointments a2
          WHERE a2.pet_id = NEW.pet_id
            AND a2.is_auto_agen = 1
            AND a2.concluido = 0
            AND substr(CAST(a2.data AS TEXT), 1, 6) = strftime('%Y%m', date(
              COALESCE(
                substr(CAST(p.ultimo_visita_data_auto AS TEXT), 1, 4) || '-' ||
                substr(CAST(p.ultimo_visita_data_auto AS TEXT), 5, 2) || '-' ||
                substr(CAST(p.ultimo_visita_data_auto AS TEXT), 7, 2),
                substr(CAST(NEW.data AS TEXT), 1, 4) || '-' ||
                substr(CAST(NEW.data AS TEXT), 5, 2) || '-' ||
                substr(CAST(NEW.data AS TEXT), 7, 2)
              ),
              '+' || CASE p.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
            ))
        ) < p.pacote_remarcacao;
  
      -- Atualiza ultimo_visita_data_auto para o MAX de pendentes
      UPDATE pets
      SET ultimo_visita_data_auto = (
        SELECT MAX(data)
        FROM appointments
        WHERE pet_id = NEW.pet_id
          AND is_auto_agen = 1
          AND concluido = 0
      )
      WHERE id = NEW.pet_id
        AND is_ativo = 1
        AND remarcacao_ativa = 1;
    END;
  `;

  // Ao CADASTRAR pet com remarcacao_ativa = 1:
  //   - Inicia os agendamentos EXATAMENTE na data_inicio_pacote selecionada
  //   - Gera agendamentos passados e futuros
  //   - Grava agendamentos ANTERIORES a hoje com is_auto_agen = 0
  //   - Grava agendamentos a partir de HOJE com is_auto_agen = 1
  const SQL_TRIGGER_PET_REMARCACAO_INSERT = `
    CREATE TRIGGER IF NOT EXISTS trg_pet_remarcacao_insert
    AFTER INSERT ON pets
    FOR EACH ROW
    WHEN NEW.remarcacao_ativa = 1 AND NEW.pacote_remarcacao IS NOT NULL
    BEGIN
      INSERT INTO appointments (pet_id, servico, data, entregar_pet, is_auto_agen)
      WITH RECURSIVE agenda(data_int, mes_atual, contagem_mes) AS (
        -- Base: Primeira visita é EXATAMENTE na data_inicio_pacote selecionada
        SELECT
          CAST(strftime('%Y%m%d', date(
            COALESCE(
              substr(CAST(NEW.data_inicio_pacote AS TEXT), 1, 4) || '-' ||
              substr(CAST(NEW.data_inicio_pacote AS TEXT), 5, 2) || '-' ||
              substr(CAST(NEW.data_inicio_pacote AS TEXT), 7, 2),
              'now'
            )
          )) AS INTEGER),
          strftime('%Y%m', date(
            COALESCE(
              substr(CAST(NEW.data_inicio_pacote AS TEXT), 1, 4) || '-' ||
              substr(CAST(NEW.data_inicio_pacote AS TEXT), 5, 2) || '-' ||
              substr(CAST(NEW.data_inicio_pacote AS TEXT), 7, 2),
              'now'
            )
          )),
          1
        UNION ALL
        -- Recursão: Próximas visitas avançam pelo gap (7 ou 14 dias)
        SELECT
          CAST(strftime('%Y%m%d', date(
            substr(CAST(data_int AS TEXT), 1, 4) || '-' ||
            substr(CAST(data_int AS TEXT), 5, 2) || '-' ||
            substr(CAST(data_int AS TEXT), 7, 2),
            '+' || CASE NEW.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
          )) AS INTEGER),
          strftime('%Y%m', date(
            substr(CAST(data_int AS TEXT), 1, 4) || '-' ||
            substr(CAST(data_int AS TEXT), 5, 2) || '-' ||
            substr(CAST(data_int AS TEXT), 7, 2),
            '+' || CASE NEW.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
          )),
          CASE
            WHEN strftime('%Y%m', date(
              substr(CAST(data_int AS TEXT), 1, 4) || '-' ||
              substr(CAST(data_int AS TEXT), 5, 2) || '-' ||
              substr(CAST(data_int AS TEXT), 7, 2),
              '+' || CASE NEW.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
            )) = mes_atual
            THEN contagem_mes + 1
            ELSE 1
          END
        FROM agenda
        -- Alvo: Avança até a data atual + PERIODO_REMARCACAO
        WHERE data_int < CAST(strftime('%Y%m%d', date('now', '${PERIODO_REMARCACAO}')) AS INTEGER)
      )
      SELECT 
        NEW.id, 
        NEW.servico_padrao, 
        data_int, 
        0, 
        -- FIX: Se a data for menor que hoje, grava 0. Se for hoje ou futura, grava 1.
        CASE 
          WHEN data_int < CAST(strftime('%Y%m%d', 'now') AS INTEGER) THEN 0 
          ELSE 1 
        END
      FROM agenda
      WHERE contagem_mes <= NEW.pacote_remarcacao;
  
      -- Salva a última data gerada em ultimo_visita_data_auto (considerando concluido = 0)
      UPDATE pets
      SET ultimo_visita_data_auto = (
        SELECT MAX(data)
        FROM appointments
        WHERE pet_id = NEW.id
          AND is_auto_agen = 1
          AND concluido = 0
      )
      WHERE id = NEW.id;
    END;
  `;
  const SQL_TRIGGER_PET_REMARCACAO_ATIVAR = `
    CREATE TRIGGER IF NOT EXISTS trg_pet_remarcacao_ativar
    AFTER UPDATE OF remarcacao_ativa, pacote_remarcacao, data_inicio_pacote, is_ativo ON pets
    FOR EACH ROW
    WHEN (
      (NEW.remarcacao_ativa = 1 AND NEW.pacote_remarcacao IS NOT NULL AND NEW.is_ativo = 1)  -- ← + AND NEW.is_ativo = 1
      OR 
      (OLD.is_ativo = 0 AND NEW.is_ativo = 1 AND NEW.remarcacao_ativa = 1 AND NEW.pacote_remarcacao IS NOT NULL)
    )
    BEGIN
      -- Limpa todos os agendamentos automáticos pendentes (passados e futuros) para evitar sobreposição ou duplicados na reativação
      DELETE FROM appointments
      WHERE pet_id = NEW.id
        AND is_auto_agen = 1
        AND concluido = 0;
  
      INSERT INTO appointments (pet_id, servico, data, entregar_pet, is_auto_agen)
      WITH RECURSIVE agenda(data_int, mes_atual, contagem_mes) AS (
        -- Base: Primeira visita ocorre EXATAMENTE na data_inicio_pacote editada/designada
        SELECT
          CAST(strftime('%Y%m%d', date(
            COALESCE(
              substr(CAST(NEW.data_inicio_pacote AS TEXT), 1, 4) || '-' ||
              substr(CAST(NEW.data_inicio_pacote AS TEXT), 5, 2) || '-' ||
              substr(CAST(NEW.data_inicio_pacote AS TEXT), 7, 2),
              'now'
            )
          )) AS INTEGER),
          strftime('%Y%m', date(
            COALESCE(
              substr(CAST(NEW.data_inicio_pacote AS TEXT), 1, 4) || '-' ||
              substr(CAST(NEW.data_inicio_pacote AS TEXT), 5, 2) || '-' ||
              substr(CAST(NEW.data_inicio_pacote AS TEXT), 7, 2),
              'now'
            )
          )),
          1
        UNION ALL
        -- Recursão: Próximas visitas aplicam o intervalo (7 ou 14 dias); reinicia contador no novo mês
        SELECT
          CAST(strftime('%Y%m%d', date(
            substr(CAST(data_int AS TEXT), 1, 4) || '-' ||
            substr(CAST(data_int AS TEXT), 5, 2) || '-' ||
            substr(CAST(data_int AS TEXT), 7, 2),
            '+' || CASE NEW.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
          )) AS INTEGER),
          strftime('%Y%m', date(
            substr(CAST(data_int AS TEXT), 1, 4) || '-' ||
            substr(CAST(data_int AS TEXT), 5, 2) || '-' ||
            substr(CAST(data_int AS TEXT), 7, 2),
            '+' || CASE NEW.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
          )),
          CASE
            WHEN strftime('%Y%m', date(
              substr(CAST(data_int AS TEXT), 1, 4) || '-' ||
              substr(CAST(data_int AS TEXT), 5, 2) || '-' ||
              substr(CAST(data_int AS TEXT), 7, 2),
              '+' || CASE NEW.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
            )) = mes_atual
            THEN contagem_mes + 1
            ELSE 1
          END
        FROM agenda
        -- Alvo: Estende as possibilidades até o período máximo contado a partir de HOJE
        WHERE data_int < CAST(strftime('%Y%m%d', date('now', '${PERIODO_REMARCACAO}')) AS INTEGER)
      )
      SELECT 
        NEW.id, 
        NEW.servico_padrao, 
        data_int, 
        0, 
        -- Filtro de retroatividade: marca com 0 se ficou no passado, mantendo coerência com o insert
        CASE 
          WHEN data_int < CAST(strftime('%Y%m%d', 'now') AS INTEGER) THEN 0 
          ELSE 1 
        END
      FROM agenda
      WHERE contagem_mes <= NEW.pacote_remarcacao
        -- Garante que não vai reinserir um agendamento antigo que já tenha sido CONCLUÍDO manualmente
        AND NOT EXISTS (
          SELECT 1 FROM appointments a 
          WHERE a.pet_id = NEW.id 
            AND a.data = data_int 
            AND a.concluido = 1
        );
  
      -- Atualiza o ponteiro do último agendamento automatizado em aberto
      UPDATE pets
      SET ultimo_visita_data_auto = (
        SELECT MAX(data)
        FROM appointments
        WHERE pet_id = NEW.id
          AND is_auto_agen = 1
          AND concluido = 0
      )
      WHERE id = NEW.id;
    END;
  `;

  // Ao DESATIVAR remarcação (1 → 0):
  //   - Exclui todos os pendentes a partir de amanhã
  //   - Mantém ultimo_visita_data_auto (histórico)
  const SQL_TRIGGER_PET_REMARCACAO_DESATIVAR = `
    CREATE TRIGGER IF NOT EXISTS trg_pet_remarcacao_desativar
    AFTER UPDATE OF remarcacao_ativa ON pets
    FOR EACH ROW
    WHEN OLD.remarcacao_ativa = 1 AND NEW.remarcacao_ativa = 0
    BEGIN
      DELETE FROM appointments
      WHERE pet_id = NEW.id
        AND is_auto_agen = 1
        AND concluido = 0
        AND data > CAST(strftime('%Y%m%d', 'now', 'localtime') AS INTEGER);
    END;
  `;

  const SQL_TRIGGER_OWNER_DESATIVAR_PETS = `
    CREATE TRIGGER IF NOT EXISTS trg_owner_desativar_pets
    AFTER UPDATE OF is_ativo ON owners
    FOR EACH ROW
    WHEN NEW.is_ativo = 0
    BEGIN
        UPDATE pets 
        SET is_ativo = 0 
        WHERE dono_id = NEW.id;
    END;
  `;

  const SQL_TRIGGER_PET_ATIVAR_OWNER = `
    CREATE TRIGGER IF NOT EXISTS trg_pet_ativar_owner
    AFTER UPDATE OF is_ativo ON pets
    FOR EACH ROW
    WHEN NEW.is_ativo = 1
    BEGIN
        UPDATE owners 
        SET is_ativo = 1 
        WHERE id = NEW.dono_id AND is_ativo = 0;
    END;
  `;

  const SQL_TRIGGER_PET_DESATIVAR_LIMPAR_REMARCACAO = `
    CREATE TRIGGER IF NOT EXISTS trg_pet_desativar_limpar_remarcacao
    AFTER UPDATE OF is_ativo ON pets
    FOR EACH ROW
    WHEN OLD.is_ativo = 1 AND NEW.is_ativo = 0
    BEGIN
      -- Remove os agendamentos futuros do pet desativado
      DELETE FROM appointments
      WHERE pet_id = NEW.id
        AND is_auto_agen = 1
        AND concluido = 0
        AND data > CAST(strftime('%Y%m%d', 'now', 'localtime') AS INTEGER);

      -- Limpa o pacote, o histórico automático e desativa a flag de remarcação
      UPDATE pets
      SET data_inicio_pacote = NULL,
          ultimo_visita_data_auto = NULL,
          remarcacao_ativa = 0
      WHERE id = NEW.id;
    END;
  `;

  // ── Execução ──────────────────────────────────────────────────────────────
  try {
    await db.execAsync(SQL_PRAGMA);

    await db.execAsync(SQL_CREATE_TABLES);

    await db.execAsync(SQL_CREATE_INDEXES);

    await db.execAsync(SQL_INSERTS);

    await db.execAsync(SQL_TRIGGER_ULTIMA_VISITA);
    await db.execAsync(SQL_TRIGGER_REMARCACAO_AUTOMATICA);
    await db.execAsync(SQL_TRIGGER_PET_REMARCACAO_INSERT);
    await db.execAsync(SQL_TRIGGER_PET_REMARCACAO_ATIVAR);
    await db.execAsync(SQL_TRIGGER_PET_REMARCACAO_DESATIVAR);
    await db.execAsync(SQL_TRIGGER_OWNER_DESATIVAR_PETS);
    await db.execAsync(SQL_TRIGGER_PET_ATIVAR_OWNER);
    await db.execAsync(SQL_TRIGGER_PET_DESATIVAR_LIMPAR_REMARCACAO);
  } catch (e) {
    console.log(e);
  }
}
