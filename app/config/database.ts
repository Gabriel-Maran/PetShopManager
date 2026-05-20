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

  // Cole abaixo os drops:

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
      id                            INTEGER PRIMARY KEY AUTOINCREMENT,
      especie_id                    INTEGER NOT NULL,
      nome_raca                     TEXT    NOT NULL,
      nome_raca_normalized  TEXT    NOT NULL,
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
      valor_pacote               TEXT DEFAULT '0,00',
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
      (3, 'Dinheiro'),
      (4, 'PIX'),
      (5, 'Outro');
      
    INSERT OR IGNORE INTO species (id, nome) VALUES
      (1, 'CAO'),
      (2, 'GATO'),
      (3, 'OUTRO');

    INSERT OR IGNORE INTO race (especie_id, nome_raca, nome_raca_normalized) VALUES
    (1, 'Vira-lata (SRD)', 'vira-lata srd'),
    (1, 'Shih Tzu', 'shih tzu'),
    (1, 'Yorkshire Terrier', 'yorkshire terrier'),
    (1, 'Poodle', 'poodle'),
    (1, 'Spitz Alemão (Lulu)', 'spitz alemao lulu'),
    (1, 'Bulldog Francês', 'bulldog frances'),
    (1, 'Pug', 'pug'),
    (1, 'Golden Retriever', 'golden retriever'),
    (1, 'Labrador Retriever', 'labrador retriever'),
    (1, 'Pinscher', 'pinscher'),
    (1, 'Pitbull', 'pitbull'),
    (1, 'Border Collie', 'border collie'),
    (1, 'Basset Hound', 'basset hound'),
    (1, 'Chow Chow', 'chow chow'),
    (2, 'Vira-lata (SRD)', 'vira-lata srd'),
    (2, 'Siamês', 'siames'),
    (2, 'Persa', 'persa'),
    (2, 'Angorá', 'angora'),
    (2, 'Maine Coon', 'maine coon'),
    (2, 'Bengal', 'bengal'),
    (2, 'Sphynx', 'sphynx'),
    (2, 'Ragdoll', 'ragdoll'),
    (3, 'Não se aplica / SRD', 'nao se aplica srd');

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
  //   1. Se o limite do mês foi atingido, calcula a data saltando para o próximo mês (no mesmo dia da semana)
  //   2. Se ainda há saldo no mês, apenas soma o gap (7 ou 14 dias)
  //   3. Atualiza ultimo_visita_data_auto para o novo MAX
  //   4. Valor por atendimento = valor_pacote / pacote_remarcacao
  const SQL_TRIGGER_REMARCACAO_AUTOMATICA = `
    CREATE TRIGGER IF NOT EXISTS trg_remarcacao_automatica
    AFTER UPDATE OF concluido ON appointments
    FOR EACH ROW
    WHEN NEW.concluido = 1
      AND NEW.is_auto_agen = 1
    BEGIN
      INSERT INTO appointments (pet_id, servico, data, entregar_pet, observacao, is_auto_agen, valor)
      SELECT
        NEW.pet_id,
        NEW.servico,
        CAST(strftime('%Y%m%d', CASE 
          -- Se a quantidade de agendamentos em aberto no mês alvo JÁ atingiu o limite do pacote
          WHEN (
            SELECT COUNT(*)
            FROM appointments a2
            WHERE a2.pet_id = NEW.pet_id
              AND a2.is_auto_agen = 1
              AND a2.concluido = 0
              AND substr(CAST(a2.data AS TEXT), 1, 6) = strftime('%Y%m', date(
                COALESCE(
                  substr(CAST(p.ultimo_visita_data_auto AS TEXT), 1, 4) || '-' || substr(CAST(p.ultimo_visita_data_auto AS TEXT), 5, 2) || '-' || substr(CAST(p.ultimo_visita_data_auto AS TEXT), 7, 2),
                  substr(CAST(NEW.data AS TEXT), 1, 4) || '-' || substr(CAST(NEW.data AS TEXT), 5, 2) || '-' || substr(CAST(NEW.data AS TEXT), 7, 2)
                )
              ))
          ) >= p.pacote_remarcacao THEN
            -- PULA PARA O PRÓXIMO MÊS: Vai para o dia 01 e calcula o deslocamento para manter o mesmo dia da semana
            date(
              COALESCE(
                substr(CAST(p.ultimo_visita_data_auto AS TEXT), 1, 4) || '-' || substr(CAST(p.ultimo_visita_data_auto AS TEXT), 5, 2) || '-01',
                substr(CAST(NEW.data AS TEXT), 1, 4) || '-' || substr(CAST(NEW.data AS TEXT), 5, 2) || '-01'
              ), 
              '+1 month', 
              '+' || ((
                CAST(strftime('%w', date(substr(CAST(NEW.data AS TEXT), 1, 4) || '-' || substr(CAST(NEW.data AS TEXT), 5, 2) || '-' || substr(CAST(NEW.data AS TEXT), 7, 2))) AS INTEGER) 
                - CAST(strftime('%w', date(COALESCE(substr(CAST(p.ultimo_visita_data_auto AS TEXT), 1, 4) || '-' || substr(CAST(p.ultimo_visita_data_auto AS TEXT), 5, 2) || '-01', substr(CAST(NEW.data AS TEXT), 1, 4) || '-' || substr(CAST(NEW.data AS TEXT), 5, 2) || '-01'), '+1 month')) AS INTEGER) 
                + 7
              ) % 7) || ' days'
            )
          ELSE
            -- SE ESTÁ DENTRO DA COTA: Soma apenas o intervalo padrão de 7 ou 14 dias
            date(
              COALESCE(
                substr(CAST(p.ultimo_visita_data_auto AS TEXT), 1, 4) || '-' || substr(CAST(p.ultimo_visita_data_auto AS TEXT), 5, 2) || '-' || substr(CAST(p.ultimo_visita_data_auto AS TEXT), 7, 2),
                substr(CAST(NEW.data AS TEXT), 1, 4) || '-' || substr(CAST(NEW.data AS TEXT), 5, 2) || '-' || substr(CAST(NEW.data AS TEXT), 7, 2)
              ),
              '+' || CASE p.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
            )
        END) AS INTEGER),
        NEW.entregar_pet,
        NEW.observacao,
        1,
        -- Valor por atendimento = valor_pacote ÷ pacote_remarcacao
        replace(printf('%.2f',
          CAST(replace(p.valor_pacote, ',', '.') AS REAL) / p.pacote_remarcacao
        ), '.', ',')
      FROM pets p
      WHERE p.id = NEW.pet_id
        AND p.is_ativo = 1
        AND p.remarcacao_ativa = 1
        AND p.pacote_remarcacao IS NOT NULL;
  
      -- Atualiza ultimo_visita_data_auto para o novo MAX de pendentes
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
  //   - Valor por atendimento = valor_pacote ÷ pacote_remarcacao
  const SQL_TRIGGER_PET_REMARCACAO_INSERT = `
    CREATE TRIGGER IF NOT EXISTS trg_pet_remarcacao_insert
    AFTER INSERT ON pets
    FOR EACH ROW
    WHEN NEW.remarcacao_ativa = 1 AND NEW.pacote_remarcacao IS NOT NULL
    BEGIN
      INSERT INTO appointments (pet_id, servico, data, entregar_pet, is_auto_agen, valor)
      WITH RECURSIVE agenda(data_int, mes_atual, contagem_mes, dia_semana_base) AS (
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
          1,
          -- Guarda o dia da semana original (0 = Domingo, 1 = Segunda, ..., 5 = Sexta)
          CAST(strftime('%w', date(
            COALESCE(
              substr(CAST(NEW.data_inicio_pacote AS TEXT), 1, 4) || '-' ||
              substr(CAST(NEW.data_inicio_pacote AS TEXT), 5, 2) || '-' ||
              substr(CAST(NEW.data_inicio_pacote AS TEXT), 7, 2),
              'now'
            )
          )) AS INTEGER)
        
        UNION ALL
        
        -- Recursão: Próximas visitas aplicam o salto dinâmico ao atingir a meta
        SELECT
          -- NOVA DATA_INT
          CAST(strftime('%Y%m%d', CASE 
            WHEN contagem_mes >= NEW.pacote_remarcacao THEN
              date(
                substr(CAST(data_int AS TEXT), 1, 4) || '-' || substr(CAST(data_int AS TEXT), 5, 2) || '-01', 
                '+1 month', 
                '+' || ((dia_semana_base - CAST(strftime('%w', date(substr(CAST(data_int AS TEXT), 1, 4) || '-' || substr(CAST(data_int AS TEXT), 5, 2) || '-01', '+1 month')) AS INTEGER) + 7) % 7) || ' days'
              )
            ELSE
              date(
                substr(CAST(data_int AS TEXT), 1, 4) || '-' || substr(CAST(data_int AS TEXT), 5, 2) || '-' || substr(CAST(data_int AS TEXT), 7, 2),
                '+' || CASE NEW.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
              )
          END) AS INTEGER),
          
          -- NOVO MES_ATUAL
          strftime('%Y%m', CASE 
            WHEN contagem_mes >= NEW.pacote_remarcacao THEN
              date(substr(CAST(data_int AS TEXT), 1, 4) || '-' || substr(CAST(data_int AS TEXT), 5, 2) || '-01', '+1 month')
            ELSE
              date(
                substr(CAST(data_int AS TEXT), 1, 4) || '-' || substr(CAST(data_int AS TEXT), 5, 2) || '-' || substr(CAST(data_int AS TEXT), 7, 2),
                '+' || CASE NEW.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
              )
          END),
          
          -- NOVA CONTAGEM_MES:
          --   1. Reseta se atingiu o limite do pacote no mês atual
          --   2. Reseta se a próxima data caiu em um mês diferente (virada natural de mês)
          --   3. Caso contrário, incrementa normalmente
          CASE 
            WHEN contagem_mes >= NEW.pacote_remarcacao THEN 1
            WHEN strftime('%Y%m', date(
              substr(CAST(data_int AS TEXT), 1, 4) || '-' || substr(CAST(data_int AS TEXT), 5, 2) || '-' || substr(CAST(data_int AS TEXT), 7, 2),
              '+' || CASE NEW.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
            )) != mes_atual THEN 1
            ELSE contagem_mes + 1
          END,
          
          dia_semana_base
        FROM agenda
        WHERE data_int < CAST(strftime('%Y%m%d', date('now', '${PERIODO_REMARCACAO}')) AS INTEGER)
      )
      SELECT 
        NEW.id, 
        NEW.servico_padrao, 
        data_int, 
        0, 
        CASE 
          WHEN data_int < CAST(strftime('%Y%m%d', 'now') AS INTEGER) THEN 0 
          ELSE 1 
        END,
        -- Valor por atendimento = valor_pacote ÷ pacote_remarcacao
        replace(printf('%.2f',
          CAST(replace(NEW.valor_pacote, ',', '.') AS REAL) / NEW.pacote_remarcacao
        ), '.', ',')
      FROM agenda;
  
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
      (NEW.remarcacao_ativa = 1 AND NEW.pacote_remarcacao IS NOT NULL AND NEW.is_ativo = 1)
      OR 
      (OLD.is_ativo = 0 AND NEW.is_ativo = 1 AND NEW.remarcacao_ativa = 1 AND NEW.pacote_remarcacao IS NOT NULL)
    )
    BEGIN
      -- Limpa todos os agendamentos automáticos pendentes anteriores
      DELETE FROM appointments
      WHERE pet_id = NEW.id
        AND is_auto_agen = 1
        AND concluido = 0;
  
      INSERT INTO appointments (pet_id, servico, data, entregar_pet, is_auto_agen, valor)
      WITH RECURSIVE agenda(data_int, mes_atual, contagem_mes, dia_semana_base) AS (
        -- Base: Primeira visita na data_inicio_pacote
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
          1,
          -- Guarda o dia da semana original (0 = Domingo, 1 = Segunda, ..., 5 = Sexta, 6 = Sábado)
          CAST(strftime('%w', date(
            COALESCE(
              substr(CAST(NEW.data_inicio_pacote AS TEXT), 1, 4) || '-' ||
              substr(CAST(NEW.data_inicio_pacote AS TEXT), 5, 2) || '-' ||
              substr(CAST(NEW.data_inicio_pacote AS TEXT), 7, 2),
              'now'
            )
          )) AS INTEGER)
        
        UNION ALL
        
        -- Recursão com inteligência de salto de mês
        SELECT
          -- NOVA DATA_INT
          CAST(strftime('%Y%m%d', CASE 
            WHEN contagem_mes >= NEW.pacote_remarcacao THEN
              date(
                substr(CAST(data_int AS TEXT), 1, 4) || '-' || substr(CAST(data_int AS TEXT), 5, 2) || '-01', 
                '+1 month', 
                '+' || ((dia_semana_base - CAST(strftime('%w', date(substr(CAST(data_int AS TEXT), 1, 4) || '-' || substr(CAST(data_int AS TEXT), 5, 2) || '-01', '+1 month')) AS INTEGER) + 7) % 7) || ' days'
              )
            ELSE
              date(
                substr(CAST(data_int AS TEXT), 1, 4) || '-' || substr(CAST(data_int AS TEXT), 5, 2) || '-' || substr(CAST(data_int AS TEXT), 7, 2),
                '+' || CASE NEW.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
              )
          END) AS INTEGER),
          
          -- NOVO MES_ATUAL
          strftime('%Y%m', CASE 
            WHEN contagem_mes >= NEW.pacote_remarcacao THEN
              date(substr(CAST(data_int AS TEXT), 1, 4) || '-' || substr(CAST(data_int AS TEXT), 5, 2) || '-01', '+1 month')
            ELSE
              date(
                substr(CAST(data_int AS TEXT), 1, 4) || '-' || substr(CAST(data_int AS TEXT), 5, 2) || '-' || substr(CAST(data_int AS TEXT), 7, 2),
                '+' || CASE NEW.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
              )
          END),
          
          -- NOVA CONTAGEM_MES:
          --   1. Reseta se atingiu o limite do pacote no mês atual
          --   2. Reseta se a próxima data caiu em um mês diferente (virada natural de mês)
          --   3. Caso contrário, incrementa normalmente
          CASE 
            WHEN contagem_mes >= NEW.pacote_remarcacao THEN 1
            WHEN strftime('%Y%m', date(
              substr(CAST(data_int AS TEXT), 1, 4) || '-' || substr(CAST(data_int AS TEXT), 5, 2) || '-' || substr(CAST(data_int AS TEXT), 7, 2),
              '+' || CASE NEW.pacote_remarcacao WHEN 2 THEN 14 ELSE 7 END || ' days'
            )) != mes_atual THEN 1
            ELSE contagem_mes + 1
          END,
          
          dia_semana_base
        FROM agenda
        WHERE data_int < CAST(strftime('%Y%m%d', date('now', '${PERIODO_REMARCACAO}')) AS INTEGER)
      )
      SELECT 
        NEW.id, 
        NEW.servico_padrao, 
        data_int, 
        0, 
        CASE 
          WHEN data_int < CAST(strftime('%Y%m%d', 'now') AS INTEGER) THEN 0 
          ELSE 1 
        END,
        -- Valor por atendimento = valor_pacote ÷ pacote_remarcacao
        replace(printf('%.2f',
          CAST(replace(NEW.valor_pacote, ',', '.') AS REAL) / NEW.pacote_remarcacao
        ), '.', ',')
      FROM agenda
      WHERE NOT EXISTS (
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
    await db.execAsync(`
  -- =====================================================
  -- OWNERS (TOTAL: 60)
  -- =====================================================

  INSERT INTO owners (nome, nome_normalizado, telefone, email, endereco) VALUES
  ('João Silva',         'joao silva',         '(44) 99911-1111', 'joao1@email.com',        'Rua A, 100'),
  ('Maria Oliveira',     'maria oliveira',     '(44) 99911-1112', 'maria2@email.com',       'Rua B, 101'),
  ('Carlos Souza',       'carlos souza',       '(44) 99911-1113', 'carlos3@email.com',      'Rua C, 102'),
  ('Fernanda Lima',      'fernanda lima',      '(44) 99911-1114', 'fernanda4@email.com',    'Rua D, 103'),
  ('Lucas Pereira',      'lucas pereira',      '(44) 99911-1115', 'lucas5@email.com',       'Rua E, 104'),
  ('Juliana Costa',      'juliana costa',      '(44) 99911-1116', 'juliana6@email.com',     'Rua F, 105'),
  ('Ricardo Alves',      'ricardo alves',      '(44) 99911-1117', 'ricardo7@email.com',     'Rua G, 106'),
  ('Patrícia Gomes',     'patricia gomes',     '(44) 99911-1118', 'patricia8@email.com',    'Rua H, 107'),
  ('André Martins',      'andre martins',      '(44) 99911-1119', 'andre9@email.com',       'Rua I, 108'),
  ('Camila Rocha',       'camila rocha',       '(44) 99911-1120', 'camila10@email.com',     'Rua J, 109'),
  ('Roberto Mendes',     'roberto mendes',     '(44) 99911-1121', 'roberto11@email.com',    'Rua K, 110'),
  ('Larissa Freitas',    'larissa freitas',    '(44) 99911-1122', 'larissa12@email.com',    'Rua L, 111'),
  ('Thiago Ribeiro',     'thiago ribeiro',     '(44) 99911-1123', 'thiago13@email.com',     'Rua M, 112'),
  ('Aline Barbosa',      'aline barbosa',      '(44) 99911-1124', 'aline14@email.com',      'Rua N, 113'),
  ('Marcelo Dias',       'marcelo dias',       '(44) 99911-1125', 'marcelo15@email.com',    'Rua O, 114'),
  ('Vanessa Teixeira',   'vanessa teixeira',   '(44) 99911-1126', 'vanessa16@email.com',    'Rua P, 115'),
  ('Eduardo Nunes',      'eduardo nunes',      '(44) 99911-1127', 'eduardo17@email.com',    'Rua Q, 116'),
  ('Bruna Castro',       'bruna castro',       '(44) 99911-1128', 'bruna18@email.com',      'Rua R, 117'),
  ('Felipe Cardoso',     'felipe cardoso',     '(44) 99911-1129', 'felipe19@email.com',     'Rua S, 118'),
  ('Tatiane Moraes',     'tatiane moraes',     '(44) 99911-1130', 'tatiane20@email.com',    'Rua T, 119'),
  ('Ricardo Santos',     'ricardo santos',     '(44) 99911-1131', 'ricardo21@email.com',    'Rua U, 120'),
  ('Camila Pires',       'camila pires',       '(44) 99911-1132', 'camila22@email.com',     'Rua V, 121'),
  ('Daniel Almeida',     'daniel almeida',     '(44) 99911-1133', 'daniel23@email.com',     'Rua W, 122'),
  ('Letícia Fonseca',    'leticia fonseca',    '(44) 99911-1134', 'leticia24@email.com',    'Rua X, 123'),
  ('Gustavo Borges',     'gustavo borges',     '(44) 99911-1135', 'gustavo25@email.com',    'Av. Central, 500'),
  ('Beatriz Ramos',      'beatriz ramos',      '(44) 99911-1136', 'beatriz26@email.com',    'Rua Y, 124'),
  ('Rodrigo Neves',      'rodrigo neves',      '(44) 99911-1137', 'rodrigo27@email.com',    'Rua Z, 125'),
  ('Priscila Cruz',      'priscila cruz',      '(44) 99911-1138', 'priscila28@email.com',   'Alameda A, 10'),
  ('Fabio Teixeira',     'fabio teixeira',     '(44) 99911-1139', 'fabio29@email.com',      'Rua das Flores, 45'),
  ('Renata Vieira',      'renata vieira',      '(44) 99911-1140', 'renata30@email.com',     'Av. Brasil, 1200'),
  ('Guilherme Melo',     'guilherme melo',     '(44) 99911-1141', 'guilherme31@email.com',  'Rua Nova, 88'),
  ('Soraia Toledo',      'soraia toledo',      '(44) 99911-1142', 'soraia32@email.com',     'Rua Pinheiro, 23'),
  ('Marcos Antunes',     'marcos antunes',     '(44) 99911-1143', 'marcos33@email.com',     'Av. Paraná, 450'),
  ('Tatiana Guimarães',  'tatiana guimaraes',  '(44) 99911-1144', 'tatiana34@email.com',    'Rua Limoeiro, 12'),
  ('Alexandre Lopes',    'alexandre lopes',    '(44) 99911-1145', 'alexandre35@email.com',  'Rua Principal, 9'),
  ('Débora Machado',     'debora machado',     '(44) 99911-1146', 'debora36@email.com',     'Travessa B, 4'),
  ('Maurício Nogueira',  'mauricio nogueira',  '(44) 99911-1147', 'mauricio37@email.com',   'Rua do Sol, 77'),
  ('Helena Farias',      'helena farias',      '(44) 99911-1148', 'helena38@email.com',     'Av. Getúlio Vargas, 31'),
  ('Breno Silveira',     'breno silveira',     '(44) 99911-1149', 'breno39@email.com',      'Rua da Paz, 99'),
  ('Mônica Carvalho',    'monica carvalho',    '(44) 99911-1150', 'monica40@email.com',     'Rua Ceará, 14'),
  ('Vitor Rezende',      'vitor rezende',      '(44) 99911-1151', 'vitor41@email.com',      'Rua Minas, 55'),
  ('Sabrina Cunha',      'sabrina cunha',      '(44) 99911-1152', 'sabrina42@email.com',    'Av. Tiradentes, 890'),
  ('Douglas Franco',     'douglas franco',     '(44) 99911-1153', 'douglas43@email.com',    'Rua Sergipe, 201'),
  ('Bianca Frota',       'bianca frota',       '(44) 99911-1154', 'bianca44@email.com',     'Rua Goiás, 33'),
  ('Igor Rocha',         'igor rocha',         '(44) 99911-1155', 'igor45@email.com',       'Av. Juscelino, 100'),
  ('Karina Sales',       'karina sales',       '(44) 99911-1156', 'karina46@email.com',     'Rua Pará, 72'),
  ('Murilo Viana',       'murilo viana',       '(44) 99911-1157', 'murilo47@email.com',     'Rua Amazonas, 19'),
  ('Aline Moraes',       'aline moraes',       '(44) 99911-1158', 'aline48@email.com',      'Rua Maranhão, 84'),
  ('Leonardo Malta',     'leonardo malta',     '(44) 99911-1159', 'leonardo49@email.com',   'Av. São Paulo, 610'),
  ('Clarice Fontes',     'clarice fontes',     '(44) 99911-1160', 'clarice50@email.com',    'Rua Bahia, 5'),
  ('Rafael Correia',     'rafael correia',     '(44) 99911-1161', 'rafael51@email.com',     'Rua Acre, 88'),
  ('Simone Pacheco',     'simone pacheco',     '(44) 99911-1162', 'simone52@email.com',     'Rua Tocantins, 34'),
  ('Bruno Lacerda',      'bruno lacerda',      '(44) 99911-1163', 'bruno53@email.com',      'Av. Duque de Caxias, 210'),
  ('Natália Campos',     'natalia campos',     '(44) 99911-1164', 'natalia54@email.com',    'Rua Piauí, 67'),
  ('Cristiano Souza',    'cristiano souza',    '(44) 99911-1165', 'cristiano55@email.com',  'Rua Espírito Santo, 12'),
  ('Mariana Bezerra',    'mariana bezerra',    '(44) 99911-1166', 'mariana56@email.com',    'Rua Rio Grande, 43'),
  ('Henrique Monteiro',  'henrique monteiro',  '(44) 99911-1167', 'henrique57@email.com',   'Av. Independência, 5'),
  ('Gabriela Ferreira',  'gabriela ferreira',  '(44) 99911-1168', 'gabriela58@email.com',   'Rua da Amizade, 78'),
  ('Leandro Prado',      'leandro prado',      '(44) 99911-1169', 'leandro59@email.com',    'Rua Vitória, 321'),
  ('Raquel Siqueira',    'raquel siqueira',    '(44) 99911-1170', 'raquel60@email.com',     'Av. dos Pioneiros, 15'),
  ('Tiago Assunção',     'tiago assuncao',     '(44) 99911-1171', 'tiago61@email.com',      'Rua Boa Esperança, 8');

  -- =====================================================
  -- PETS (TOTAL: 60)
  -- Columns: nome, nome_normalizado, especie, porte, raca, observacoes,
  --          dono_id, servico_padrao, remarcacao_ativa, pacote_remarcacao,
  --          valor_pacote, data_inicio_pacote, current_ultima_visita_data,
  --          ultimo_visita_data_auto, is_ativo
  -- especie: 1=Cão  2=Gato
  -- raca: 1=SRD  2=Poodle  3=Labrador  4=Persa  5=Siamês
  -- =====================================================

  INSERT INTO pets (
    nome, nome_normalizado, especie, porte, raca, observacoes, dono_id,
    servico_padrao, remarcacao_ativa, pacote_remarcacao, valor_pacote,
    data_inicio_pacote, current_ultima_visita_data, ultimo_visita_data_auto, is_ativo
  ) VALUES
  ('Thor',      'thor',      1, 'Grande',  3, 'Muito ativo',                         1,  'Banho e Tosa',    1, 4, '320,00', 20260501, 20260510, 20260510, 1),
  ('Luna',      'luna',      2, 'Pequeno', 4, 'Assustada',                           2,  'Banho',           0, NULL, '0,00', NULL,      20260502, 20260502, 1),
  ('Mel',       'mel',       1, 'Pequeno', 1, 'Dócil',                               3,  'Banho',           1, 2, '160,00', 20260425, 20260505, 20260505, 1),
  ('Bob',       'bob',       1, 'Grande',  3, 'Agitado',                             4,  'Tosa Higiênica',  0, NULL, '0,00', NULL,      20260428, 20260428, 1),
  ('Nina',      'nina',      2, 'Pequeno', 5, 'Calma',                               5,  'Banho',           0, NULL, '0,00', NULL,      20260501, 20260501, 1),
  ('Max',       'max',       1, 'Médio',   2, 'Late bastante',                       6,  'Banho e Tosa',    1, 4, '280,00', 20260420, 20260506, 20260506, 1),
  ('Bella',     'bella',     1, 'Pequeno', 1, 'Precisa cortar unhas',                7,  'Banho',           0, NULL, '0,00', NULL,      20260504, 20260504, 1),
  ('Simba',     'simba',     2, 'Pequeno', 4, 'Arisco',                              8,  'Banho',           0, NULL, '0,00', NULL,      20260503, 20260503, 1),
  ('Toby',      'toby',      1, 'Médio',   2, 'Muito energético',                    9,  'Banho e Tosa',    1, 2, '200,00', 20260418, 20260507, 20260507, 1),
  ('Mia',       'mia',       2, 'Pequeno', 5, 'Quietinha',                           10, 'Banho',           0, NULL, '0,00', NULL,      20260505, 20260505, 1),
  ('Fred',      'fred',      1, 'Grande',  3, 'Amigável',                            11, 'Tosa Higiênica',  0, NULL, '0,00', NULL,      20260502, 20260502, 1),
  ('Julie',     'julie',     1, 'Pequeno', 1, 'Sensível ao secador',                 12, 'Banho',           1, 4, '240,00', 20260415, 20260509, 20260509, 1),
  ('Oliver',    'oliver',    2, 'Pequeno', 4, 'Gosta de colo',                       13, 'Banho',           0, NULL, '0,00', NULL,      20260501, 20260501, 1),
  ('Rex',       'rex',       1, 'Grande',  3, 'Muito forte',                         14, 'Banho e Tosa',    1, 2, '360,00', 20260422, 20260508, 20260508, 1),
  ('Lola',      'lola',      1, 'Pequeno', 2, 'Boazinha',                            15, 'Banho',           0, NULL, '0,00', NULL,      20260506, 20260506, 1),
  ('Pandora',   'pandora',   2, 'Pequeno', 5, 'Pelagem longa',                       16, 'Banho',           0, NULL, '0,00', NULL,      20260504, 20260504, 1),
  ('Spike',     'spike',     1, 'Médio',   2, 'Corre muito',                         17, 'Tosa Higiênica',  1, 4, '300,00', 20260410, 20260503, 20260503, 1),
  ('Kiara',     'kiara',     2, 'Pequeno', 4, 'Muito dócil',                         18, 'Banho',           0, NULL, '0,00', NULL,      20260507, 20260507, 1),
  ('Zeus',      'zeus',      1, 'Grande',  3, 'Obediente',                           19, 'Banho e Tosa',    1, 2, '380,00', 20260419, 20260510, 20260510, 1),
  ('Amora',     'amora',     1, 'Pequeno', 1, 'Filhote',                             20, 'Banho',           0, NULL, '0,00', NULL,      20260508, 20260508, 1),
  ('Apollo',    'apollo',    1, 'Grande',  3, 'Gosta de brincar com bola',           21, 'Banho e Tosa',    1, 4, '340,00', 20260501, 20260512, 20260512, 1),
  ('Bela',      'bela',      1, 'Pequeno', 1, 'Medo de outros cães',                 22, 'Banho',           0, NULL, '0,00', NULL,      20260505, 20260505, 1),
  ('Chico',     'chico',     2, 'Pequeno', 4, 'Dorme muito',                         23, 'Banho',           0, NULL, '0,00', NULL,      20260502, 20260502, 1),
  ('Cacau',     'cacau',     1, 'Médio',   2, 'Pele sensível usar shampoo neutro',   24, 'Banho',           1, 2, '180,00', 20260420, 20260511, 20260511, 1),
  ('Duke',      'duke',      1, 'Grande',  3, 'Puxa muito a guia',                   25, 'Tosa Higiênica',  0, NULL, '0,00', NULL,      20260429, 20260429, 1),
  ('Frida',     'frida',     1, 'Pequeno', 1, 'Chora ao separar do dono',            26, 'Banho e Tosa',    1, 4, '260,00', 20260502, 20260513, 20260513, 1),
  ('Garfield',  'garfield',  2, 'Pequeno', 5, 'Muito gordo e calmo',                 27, 'Banho',           0, NULL, '0,00', NULL,      20260506, 20260506, 1),
  ('Hunter',    'hunter',    1, 'Grande',  3, 'Cão de guarda dócil',                 28, 'Banho e Tosa',    0, NULL, '0,00', NULL,      20260504, 20260504, 1),
  ('Jade',      'jade',      2, 'Pequeno', 4, 'Unhas muito compridas',               29, 'Banho',           1, 2, '140,00', 20260422, 20260510, 20260510, 1),
  ('Kronos',    'kronos',    1, 'Grande',  3, 'Idoso precisa de paciência',          30, 'Banho',           0, NULL, '0,00', NULL,      20260507, 20260507, 1),
  ('Luke',      'luke',      1, 'Médio',   2, 'Tosa na máquina alta',                31, 'Banho e Tosa',    1, 4, '280,00', 20260415, 20260514, 20260514, 1),
  ('Mimi',      'mimi',      2, 'Pequeno', 5, 'Gosta de cafuné',                     32, 'Banho',           0, NULL, '0,00', NULL,      20260503, 20260503, 1),
  ('Nico',      'nico',      1, 'Pequeno', 1, 'Muito rápido e esperto',              33, 'Banho',           0, NULL, '0,00', NULL,      20260509, 20260509, 1),
  ('Ozzy',      'ozzy',      1, 'Médio',   2, 'Muito barulhento',                    34, 'Tosa Higiênica',  1, 2, '220,00', 20260428, 20260512, 20260512, 1),
  ('Pipoca',    'pipoca',    1, 'Pequeno', 1, 'Não gosta que mexam nas patas',       35, 'Banho',           0, NULL, '0,00', NULL,      20260508, 20260508, 1),
  ('Rocco',     'rocco',     1, 'Grande',  3, 'Bastante babão',                      36, 'Banho e Tosa',    0, NULL, '0,00', NULL,      20260505, 20260505, 1),
  ('Sasha',     'sasha',     2, 'Pequeno', 4, 'Tímida esconde no colo',              37, 'Banho',           0, NULL, '0,00', NULL,      20260501, 20260501, 1),
  ('Teddy',     'teddy',     1, 'Pequeno', 2, 'Pelo embaraça fácil',                 38, 'Banho e Tosa',    1, 4, '240,00', 20260410, 20260511, 20260511, 1),
  ('Vicky',     'vicky',     1, 'Pequeno', 1, 'Adora petiscos',                      39, 'Banho',           0, NULL, '0,00', NULL,      20260510, 20260510, 1),
  ('Zeca',      'zeca',      1, 'Médio',   2, 'Agitado com soprador',                40, 'Banho',           1, 2, '200,00', 20260426, 20260509, 20260509, 1),
  ('Bud',       'bud',       1, 'Grande',  3, 'Tranquilo com outros pets',           41, 'Banho',           0, NULL, '0,00', NULL,      20260504, 20260504, 1),
  ('Cléo',      'cleo',      2, 'Pequeno', 5, 'Arisca na hora de secar',             42, 'Banho',           0, NULL, '0,00', NULL,      20260507, 20260507, 1),
  ('Floquinho', 'floquinho', 1, 'Pequeno', 2, 'Pelo totalmente branco',              43, 'Banho e Tosa',    1, 4, '260,00', 20260418, 20260513, 20260513, 1),
  ('Guga',      'guga',      1, 'Médio',   2, 'Adora brincar na água',               44, 'Banho',           0, NULL, '0,00', NULL,      20260506, 20260506, 1),
  ('Loki',      'loki',      1, 'Grande',  3, 'Destruidor de brinquedos',            45, 'Tosa Higiênica',  0, NULL, '0,00', NULL,      20260502, 20260502, 1),
  ('Maya',      'maya',      1, 'Pequeno', 1, 'Muito dengosa',                       46, 'Banho',           1, 2, '160,00', 20260424, 20260514, 20260514, 1),
  ('Oliver',    'oliver',    1, 'Médio',   2, 'Tosa tesoura nas pernas',             47, 'Banho e Tosa',    0, NULL, '0,00', NULL,      20260505, 20260505, 1),
  ('Princesa',  'princesa',  2, 'Pequeno', 4, 'Calma e silenciosa',                  48, 'Banho',           0, NULL, '0,00', NULL,      20260508, 20260508, 1),
  ('Simba',     'simba',     1, 'Pequeno', 1, 'Latido muito agudo',                  49, 'Banho',           1, 4, '200,00', 20260412, 20260510, 20260510, 1),
  ('Urso',      'urso',      1, 'Grande',  3, 'Pelagem densa e grossa',              50, 'Banho e Tosa',    0, NULL, '0,00', NULL,      20260511, 20260511, 1),
  ('Pingo',     'pingo',     1, 'Pequeno', 1, 'Gosta de colo',                       51, 'Banho',           1, 2, '140,00', 20260503, 20260515, 20260515, 1),
  ('Isis',      'isis',      2, 'Pequeno', 5, 'Pelo longo precisa de escovação',     52, 'Banho',           0, NULL, '0,00', NULL,      20260509, 20260509, 1),
  ('Brutus',    'brutus',    1, 'Grande',  3, 'Forte mas obediente',                 53, 'Banho e Tosa',    1, 4, '360,00', 20260507, 20260516, 20260516, 1),
  ('Fifi',      'fifi',      1, 'Pequeno', 2, 'Muito animada',                       54, 'Banho',           0, NULL, '0,00', NULL,      20260504, 20260504, 1),
  ('Titan',     'titan',     1, 'Grande',  3, 'Precisa de focinheira',               55, 'Banho e Tosa',    1, 2, '400,00', 20260415, 20260515, 20260515, 1),
  ('Nala',      'nala',      1, 'Médio',   1, 'Dócil e carinhosa',                   56, 'Banho',           0, NULL, '0,00', NULL,      20260512, 20260512, 1),
  ('Bolinha',   'bolinha',   1, 'Pequeno', 2, 'Enrolado no pelo',                    57, 'Banho e Tosa',    1, 4, '240,00', 20260420, 20260513, 20260513, 1),
  ('Salem',     'salem',     2, 'Pequeno', 4, 'Muito curioso',                       58, 'Banho',           0, NULL, '0,00', NULL,      20260510, 20260510, 1),
  ('Hércules',  'hercules',  1, 'Grande',  3, 'Muito pesado dificulta na mesa',      59, 'Tosa Higiênica',  1, 2, '320,00', 20260422, 20260514, 20260514, 1),
  ('Pitoco',    'pitoco',    1, 'Pequeno', 1, 'Latido constante',                    60, 'Banho',           0, NULL, '0,00', NULL,      20260511, 20260511, 1),
  ('Dulce',     'dulce',     2, 'Pequeno', 5, 'Ronrona o tempo todo',                61, 'Banho',           1, 4, '180,00', 20260430, 20260516, 20260516, 1);

  -- =====================================================
  -- APPOINTMENTS (TOTAL: 60)
  -- =====================================================

  INSERT INTO appointments (
    pet_id, servico, data, hora, entregar_pet, concluido, observacao, is_auto_agen
  ) VALUES
  -- 20260515 (10 agendamentos)
  (1,  'Banho e Tosa',   20260515, '08:00', 1, 1, 'Perfume suave',            0),
  (2,  'Banho',          20260515, '08:30', 0, 1, 'Tudo ok',                  0),
  (3,  'Banho',          20260515, '09:00', 1, 0, 'Remarcação ativa',         1),
  (4,  'Tosa Higiênica', 20260515, '09:30', 0, 0, 'Agitado',                  0),
  (5,  'Banho',          20260515, '10:00', 1, 1, 'Calma durante banho',      0),
  (6,  'Banho e Tosa',   20260515, '10:30', 0, 0, 'Cliente atrasado',         1),
  (7,  'Banho',          20260515, '11:00', 1, 0, 'Cortar unhas',             0),
  (8,  'Banho',          20260515, '11:30', 0, 1, 'Muito quieto',             0),
  (9,  'Banho e Tosa',   20260515, '13:00', 1, 0, 'Tosa baixa',               1),
  (10, 'Banho',          20260515, '13:30', 0, 0, 'Sem observações',          0),
  -- 20260516 (10 agendamentos)
  (11, 'Tosa Higiênica', 20260516, '08:00', 1, 1, 'Muito amigável',           0),
  (12, 'Banho',          20260516, '08:30', 0, 0, 'Sensível ao secador',      1),
  (13, 'Banho',          20260516, '09:00', 1, 0, 'Gosta de colo',            0),
  (14, 'Banho e Tosa',   20260516, '09:30', 0, 1, 'Muito forte',              1),
  (15, 'Banho',          20260516, '10:00', 1, 0, 'Cliente pediu hidratação', 0),
  (16, 'Banho',          20260516, '10:30', 0, 0, 'Pelagem longa',            0),
  (17, 'Tosa Higiênica', 20260516, '11:00', 1, 1, 'Muito ativo',              1),
  (18, 'Banho',          20260516, '11:30', 0, 0, 'Muito dócil',              0),
  (19, 'Banho e Tosa',   20260516, '13:00', 1, 0, 'Obediente',                1),
  (20, 'Banho',          20260516, '13:30', 0, 1, 'Filhote',                  0),
  -- 20260517 (10 agendamentos)
  (21, 'Banho e Tosa',   20260517, '08:00', 1, 0, 'Perfume de talco',         1),
  (22, 'Banho',          20260517, '08:30', 0, 1, 'Feito com cuidado',        0),
  (23, 'Banho',          20260517, '09:00', 1, 0, 'Gato calmo',               0),
  (24, 'Banho',          20260517, '09:30', 0, 0, 'Xampu hipoalergênico',     1),
  (25, 'Tosa Higiênica', 20260517, '10:00', 1, 1, 'Limpeza de orelhas ok',   0),
  (26, 'Banho e Tosa',   20260517, '10:30', 0, 0, 'Chorou um pouco',          1),
  (27, 'Banho',          20260517, '11:00', 1, 1, 'Nenhum problema',          0),
  (28, 'Banho e Tosa',   20260517, '11:30', 0, 0, 'Tosa padrão raça',         0),
  (29, 'Banho',          20260517, '13:00', 1, 0, 'Corte de unhas feito',     1),
  (30, 'Banho',          20260517, '13:30', 0, 0, 'Cuidado com a coluna',     0),
  -- 20260518 (10 agendamentos)
  (31, 'Banho e Tosa',   20260518, '08:00', 1, 1, 'Máquina 4',                1),
  (32, 'Banho',          20260518, '08:30', 0, 0, 'Secagem lenta',            0),
  (33, 'Banho',          20260518, '09:00', 1, 0, 'Sem nós',                  0),
  (34, 'Tosa Higiênica', 20260518, '09:30', 0, 1, 'Agitado na mesa',          1),
  (35, 'Banho',          20260518, '10:00', 1, 0, 'Cuidado com as patas',     0),
  (36, 'Banho e Tosa',   20260518, '10:30', 0, 0, 'Tosa curta',               0),
  (37, 'Banho',          20260518, '11:00', 1, 1, 'Muito assustada',          0),
  (38, 'Banho e Tosa',   20260518, '11:30', 0, 0, 'Desembolo de pelo',        1),
  (39, 'Banho',          20260518, '13:00', 1, 0, 'Ganhou gravata azul',      0),
  (40, 'Banho',          20260518, '13:30', 0, 1, 'Secador morno',            1),
  -- 20260519 (10 agendamentos)
  (41, 'Banho',          20260519, '08:00', 1, 1, 'Tranquilo na banheira',    0),
  (42, 'Banho',          20260519, '08:30', 0, 0, 'Não gostou do secador',    0),
  (43, 'Banho e Tosa',   20260519, '09:00', 1, 1, 'Pelo branco impecável',    1),
  (44, 'Banho',          20260519, '09:30', 0, 0, 'Adora a água',             0),
  (45, 'Tosa Higiênica', 20260519, '10:00', 1, 0, 'Limpeza de orelhas',       0),
  (46, 'Banho',          20260519, '10:30', 0, 1, 'Dengosa como sempre',      1),
  (47, 'Banho e Tosa',   20260519, '11:00', 1, 0, 'Tesoura nas pernas feita', 0),
  (48, 'Banho',          20260519, '11:30', 0, 0, 'Calma no colo',            0),
  (49, 'Banho',          20260519, '13:00', 1, 1, 'Latiu bastante',           1),
  (50, 'Banho e Tosa',   20260519, '13:30', 0, 0, 'Pelo denso dificulta',     0),
  -- 20260520 (10 agendamentos)
  (51, 'Banho',          20260520, '08:00', 1, 0, 'Aguardando dono',          1),
  (52, 'Banho',          20260520, '08:30', 0, 0, 'Escovação extra',          0),
  (53, 'Banho e Tosa',   20260520, '09:00', 1, 0, 'Focinheira necessária',    1),
  (54, 'Banho',          20260520, '09:30', 0, 0, 'Muito animada',            0),
  (55, 'Banho e Tosa',   20260520, '10:00', 1, 0, 'Precisa de paciência',     1),
  (56, 'Banho',          20260520, '10:30', 0, 0, 'Carinhosa e dócil',        0),
  (57, 'Banho e Tosa',   20260520, '11:00', 1, 0, 'Desembolo antes do banho', 1),
  (58, 'Banho',          20260520, '11:30', 0, 0, 'Curioso com tudo',         0),
  (59, 'Tosa Higiênica', 20260520, '13:00', 1, 0, 'Muito pesado',             1),
  (60, 'Banho',          20260520, '13:30', 0, 0, 'Latido não parou',         0);
`);
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
