  import * as SQLite from "expo-sqlite";

  let db: SQLite.SQLiteDatabase | null = null;

  // ─── Período máximo de remarcação automática ──────────────────────────────────
  // Troque o valor conforme necessário:
  //   '+365 days' = 1 ano | '+180 days' = 6 meses | '+30 days' = 1 mês
  const PERIODO_REMARCACAO = "+227 days";
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

  export async function initDatabase(): Promise<void> {
    const db = await getDatabase();

    /*
    -- ── RESET DE DESENVOLVIMENTO ─────────────────────────────────────────────
    -- Descomente para recriar o banco do zero.
    -- IMPORTANTE: mover para ANTES do primeiro CREATE TABLE ao usar.

      DROP TRIGGER IF EXISTS trg_ultima_visita;
      DROP TRIGGER IF EXISTS trg_remarcacao_automatica;
      DROP TRIGGER IF EXISTS trg_pet_remarcacao_insert;
      DROP TRIGGER IF EXISTS trg_pet_remarcacao_ativar;
      DROP TRIGGER IF EXISTS trg_pet_remarcacao_desativar;

      DROP INDEX IF EXISTS idx_pets_dono_id;
      DROP INDEX IF EXISTS idx_appointments_pet_id;
      DROP INDEX IF EXISTS idx_appointments_pet_data;
      DROP INDEX IF EXISTS idx_appointments_data_concluido;
      DROP INDEX IF EXISTS idx_owners_nome;
      DROP INDEX IF EXISTS idx_pets_nome;

      DROP TABLE IF EXISTS appointments;
      DROP TABLE IF EXISTS pets;
      DROP TABLE IF EXISTS owners;
    */

    await db.execAsync(`
      PRAGMA foreign_keys = ON;

      -- ── Tabelas ──────────────────────────────────────────────────────────────
      
      CREATE TABLE IF NOT EXISTS species (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT    NOT NULL UNIQUE  
      );


      CREATE TABLE IF NOT EXISTS race (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      especie_id INTEGER NOT NULL,
      nome_raca  TEXT UNIQUE NOT NULL,
      FOREIGN KEY (especie_id) REFERENCES species(id) ON DELETE CASCADE
      UNIQUE(especie_id, nome_raca)
      );


      INSERT OR IGNORE INTO species (id, nome) VALUES (1, 'CAO'), (2, 'GATO'), (3, 'OUTRO');
      
      INSERT OR IGNORE INTO race (especie_id, nome_raca) VALUES
      -- ─── CÃES (especie_id = 1) ──────────────────────────────────
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
    
      -- ─── GATOS (especie_id = 2) ─────────────────────────────────
      (2, 'Vira-lata (SRD)'),
      (2, 'Siamês'),
      (2, 'Persa'),
      (2, 'Angorá'),
      (2, 'Maine Coon'),
      (2, 'Bengal'),
      (2, 'Sphynx'),
      (2, 'Ragdoll'),
    
      -- ─── OUTROS (especie_id = 3) ────────────────────────────────
      (3, 'Não se aplica / SRD');


      CREATE TABLE IF NOT EXISTS owners (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        nome      TEXT    NOT NULL,
        telefone  TEXT    NOT NULL,
        email     TEXT,
        endereco  TEXT,
        is_ativo  INTEGER NOT NULL DEFAULT 1,
        criado_em INTEGER NOT NULL DEFAULT (strftime('%Y%m%d', 'now'))
      );

      CREATE TABLE IF NOT EXISTS pets (
        id                         INTEGER PRIMARY KEY AUTOINCREMENT,
        nome                       TEXT    NOT NULL,
        especie                    INTEGER NOT NULL,
        porte                      TEXT    NOT NULL,
        raca                       INTEGER NOT NULL,
        observacoes                TEXT,
        dono_id                    INTEGER NOT NULL,
        servico_padrao             TEXT    NOT NULL DEFAULT 'Banho',
        remarcacao_ativa           INTEGER NOT NULL DEFAULT 0,
        -- 2 = quinzenal (14 dias, máx 2/mês) | 4 = semanal (7 dias, máx 4/mês)
        pacote_remarcacao          INTEGER CHECK (pacote_remarcacao IN (2, 4)),
        -- Data de início da série de agendamentos automáticos (formato YYYYMMDD)
        data_inicio_pacote         INTEGER,
        current_ultima_visita_data INTEGER,
        ultimo_visita_data_auto    INTEGER,
        is_ativo                   INTEGER NOT NULL DEFAULT 1,
        criado_em                  INTEGER NOT NULL DEFAULT (strftime('%Y%m%d', 'now')),
      FOREIGN KEY (dono_id) REFERENCES owners(id) ON DELETE CASCADE,
      FOREIGN KEY (especie) REFERENCES species(id) ON DELETE RESTRICT,
      FOREIGN KEY (raca) REFERENCES RACE(id) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id       INTEGER NOT NULL,
        servico      TEXT    NOT NULL,
        data         INTEGER NOT NULL,
        hora         TEXT NOT NULL DEFAULT '00:00',
        entregar_pet INTEGER NOT NULL DEFAULT 0,
        concluido    INTEGER NOT NULL DEFAULT 0,
        observacao   TEXT,
        is_auto_agen INTEGER NOT NULL DEFAULT 0,
        criado_em    INTEGER NOT NULL DEFAULT (strftime('%Y%m%d', 'now')),
        FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
      );


      -- ── Indexes ──────────────────────────────────────────────────────────────

      CREATE INDEX IF NOT EXISTS idx_pets_dono_id
        ON pets (dono_id);

      CREATE INDEX IF NOT EXISTS idx_appointments_pet_id
        ON appointments (pet_id);

      CREATE INDEX IF NOT EXISTS idx_appointments_pet_data
        ON appointments (pet_id, data);

      CREATE INDEX IF NOT EXISTS idx_appointments_data_concluido
        ON appointments (data, concluido);

      -- Busca por nome (LIKE '%termo%') em owners e pets
      CREATE INDEX IF NOT EXISTS idx_owners_nome
        ON owners (nome);

      CREATE INDEX IF NOT EXISTS idx_pets_nome
        ON pets (nome);

      -- ── Trigger: atualiza current_ultima_visita_data ao CONCLUIR agendamento ─
      -- Registra a data real em que o serviço aconteceu.

      CREATE TRIGGER IF NOT EXISTS trg_ultima_visita
      AFTER UPDATE OF concluido ON appointments
      FOR EACH ROW
      WHEN NEW.concluido = 1
      BEGIN
        UPDATE pets
        SET current_ultima_visita_data = NEW.data
        WHERE id = NEW.pet_id;
      END;

      -- ── Trigger: cria próximo agendamento ao CONCLUIR (apenas is_auto_agen=1) ─
      -- Gap calculado pelo pacote: 2 → 14 dias | 4 → 7 dias.
      -- Só avança se o novo agendamento NÃO ultrapassar o limite mensal do pacote:
      --   pacote 2 → máx 2 agendamentos auto no mesmo mês/ano
      --   pacote 4 → máx 4 agendamentos auto no mesmo mês/ano

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
          -- Próxima data = data concluída + gap do pacote
          CAST(strftime('%Y%m%d', date(
            substr(CAST(NEW.data AS TEXT), 1, 4) || '-' ||
            substr(CAST(NEW.data AS TEXT), 5, 2) || '-' ||
            substr(CAST(NEW.data AS TEXT), 7, 2),
            '+' || CASE p.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
          )) AS INTEGER),
          NEW.entregar_pet,
          NEW.observacao,
          1
        FROM pets p
        WHERE p.id = NEW.pet_id
          AND p.remarcacao_ativa = 1
          AND p.pacote_remarcacao IS NOT NULL
          -- Guarda a próxima data em uma CTE inline para reutilizar nos filtros
          AND (
            SELECT COUNT(*)
            FROM appointments a2
            WHERE a2.pet_id = NEW.pet_id
              AND a2.is_auto_agen = 1
              AND a2.concluido = 0
              -- mesmo mês/ano da próxima data
              AND substr(CAST(a2.data AS TEXT), 1, 6) = strftime('%Y%m', date(
                substr(CAST(NEW.data AS TEXT), 1, 4) || '-' ||
                substr(CAST(NEW.data AS TEXT), 5, 2) || '-' ||
                substr(CAST(NEW.data AS TEXT), 7, 2),
                '+' || CASE p.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
              ))
          ) < p.pacote_remarcacao;
      END;

      -- ── Trigger: gera série ao INSERIR pet com remarcação já ativa ───────────
      -- Série começa em data_inicio_pacote (ou hoje se nulo).
      -- Cada slot respeita o limite mensal do pacote antes de ser inserido.

      CREATE TRIGGER IF NOT EXISTS trg_pet_remarcacao_insert
      AFTER INSERT ON pets
      FOR EACH ROW
      WHEN NEW.remarcacao_ativa = 1 AND NEW.pacote_remarcacao IS NOT NULL
      BEGIN
        INSERT INTO appointments (pet_id, servico, data, entregar_pet, is_auto_agen)
        WITH RECURSIVE agenda(data_int, mes_atual, contagem_mes) AS (
          -- Primeiro slot: data_inicio_pacote ou hoje + gap
          SELECT
            CAST(strftime('%Y%m%d', date(
              COALESCE(
                substr(CAST(NEW.data_inicio_pacote AS TEXT), 1, 4) || '-' ||
                substr(CAST(NEW.data_inicio_pacote AS TEXT), 5, 2) || '-' ||
                substr(CAST(NEW.data_inicio_pacote AS TEXT), 7, 2),
                'now'
              ),
              '+' || CASE NEW.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
            )) AS INTEGER),
            strftime('%Y%m', date(
              COALESCE(
                substr(CAST(NEW.data_inicio_pacote AS TEXT), 1, 4) || '-' ||
                substr(CAST(NEW.data_inicio_pacote AS TEXT), 5, 2) || '-' ||
                substr(CAST(NEW.data_inicio_pacote AS TEXT), 7, 2),
                'now'
              ),
              '+' || CASE NEW.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
            )),
            1
          UNION ALL
          -- Próximos slots
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
          WHERE data_int < CAST(strftime('%Y%m%d', date('now', '${PERIODO_REMARCACAO}')) AS INTEGER)
            -- Respeita o limite mensal do pacote
            AND contagem_mes < NEW.pacote_remarcacao
        )
        SELECT NEW.id, NEW.servico_padrao, data_int, 0, 1
        FROM agenda
        WHERE contagem_mes <= NEW.pacote_remarcacao;
      END;

      -- ── Trigger: gera série ao ATIVAR remarcação (0 → 1) ─────────────────────

      CREATE TRIGGER IF NOT EXISTS trg_pet_remarcacao_ativar
      AFTER UPDATE OF remarcacao_ativa ON pets
      FOR EACH ROW
      WHEN OLD.remarcacao_ativa = 0 AND NEW.remarcacao_ativa = 1
        AND NEW.pacote_remarcacao IS NOT NULL
      BEGIN
        INSERT INTO appointments (pet_id, servico, data, entregar_pet, is_auto_agen)
        WITH RECURSIVE agenda(data_int, mes_atual, contagem_mes) AS (
          SELECT
            CAST(strftime('%Y%m%d', date(
              COALESCE(
                substr(CAST(NEW.data_inicio_pacote AS TEXT), 1, 4) || '-' ||
                substr(CAST(NEW.data_inicio_pacote AS TEXT), 5, 2) || '-' ||
                substr(CAST(NEW.data_inicio_pacote AS TEXT), 7, 2),
                'now'
              ),
              '+' || CASE NEW.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
            )) AS INTEGER),
            strftime('%Y%m', date(
              COALESCE(
                substr(CAST(NEW.data_inicio_pacote AS TEXT), 1, 4) || '-' ||
                substr(CAST(NEW.data_inicio_pacote AS TEXT), 5, 2) || '-' ||
                substr(CAST(NEW.data_inicio_pacote AS TEXT), 7, 2),
                'now'
              ),
              '+' || CASE NEW.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
            )),
            1
          UNION ALL
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
          WHERE data_int < CAST(strftime('%Y%m%d', date('now', '${PERIODO_REMARCACAO}')) AS INTEGER)
            AND contagem_mes < NEW.pacote_remarcacao
        )
        SELECT NEW.id, NEW.servico_padrao, data_int, 0, 1
        FROM agenda
        WHERE contagem_mes <= NEW.pacote_remarcacao;
      END;

      -- ── Trigger: remove agendamentos automáticos futuros ao DESATIVAR ─────────
      -- Remove apenas agendamentos com is_auto_agen = 1, não concluídos, futuros.
      -- Agendamentos manuais (is_auto_agen = 0) são preservados.

      CREATE TRIGGER IF NOT EXISTS trg_pet_remarcacao_desativar
      AFTER UPDATE OF remarcacao_ativa ON pets
      FOR EACH ROW
      WHEN OLD.remarcacao_ativa = 1 AND NEW.remarcacao_ativa = 0
      BEGIN
        DELETE FROM appointments
        WHERE pet_id = NEW.id
          AND is_auto_agen = 1
          AND concluido = 0
          AND data > CAST(strftime('%Y%m%d', 'now') AS INTEGER);
      END;
    `);
  }
