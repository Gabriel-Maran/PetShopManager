// Versão 1 do esquema: o de antes das migrações (DADOS-1). Não mude este arquivo: uma versão
// publicada não muda mais, e a mudança entra como a versão seguinte.
import type { Migration } from "../migrator";

// ─── Período máximo de remarcação automática ──────────────────────────────────
//   '+365 days' = 1 ano | '+180 days' = 6 meses | '+30 days' = 1 mês
// O valor entra no texto dos triggers da versão 1, que não muda mais. Para trocar o período, crie uma
// migração nova que recrie os triggers com o valor novo.
export const PERIODO_REMARCACAO = "+224 days";
// ─────────────────────────────────────────────────────────────────────────────

// ─── Gap por pacote ───────────────────────────────────────────────────────────
// Pacote 2 → a cada 14 dias (máx. 2 banhos/mês)
// Pacote 4 → a cada  7 dias (máx. 4 banhos/mês)
// ─────────────────────────────────────────────────────────────────────────────

// ── Tabelas ───────────────────────────────────────────────────────────────

export const SQL_CREATE_TABLES = `
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
    horario_padrao             TEXT DEFAULT '00:00',
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

export const SQL_CREATE_INDEXES = `
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

export const SQL_INSERTS = `
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
export const SQL_TRIGGER_ULTIMA_VISITA = `
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
export const SQL_TRIGGER_REMARCACAO_AUTOMATICA = `
  CREATE TRIGGER IF NOT EXISTS trg_remarcacao_automatica
  AFTER UPDATE OF concluido ON appointments
  FOR EACH ROW
  WHEN NEW.concluido = 1
    AND NEW.is_auto_agen = 1
  BEGIN
    INSERT INTO appointments (pet_id, servico, data, hora, entregar_pet, observacao, is_auto_agen, valor)
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
      p.horario_padrao,
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
export const SQL_TRIGGER_PET_REMARCACAO_INSERT = `
  CREATE TRIGGER IF NOT EXISTS trg_pet_remarcacao_insert
  AFTER INSERT ON pets
  FOR EACH ROW
  WHEN NEW.remarcacao_ativa = 1 AND NEW.pacote_remarcacao IS NOT NULL
  BEGIN
    INSERT INTO appointments (pet_id, servico, data, hora, entregar_pet, is_auto_agen, valor)
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
      NEW.horario_padrao,
      0, 
      CASE 
        WHEN 
            data_int < CAST(strftime('%Y%m%d', 'now') AS INTEGER) 
            OR (
              data_int = CAST(strftime('%Y%m%d', 'now', 'localtime') AS INTEGER)
              AND NEW.horario_padrao < strftime('%H:%M', 'now', 'localtime')
            )
        THEN 0 
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

export const SQL_TRIGGER_PET_REMARCACAO_ATIVAR = `
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

    INSERT INTO appointments (pet_id, servico, data, hora, entregar_pet, is_auto_agen, valor)
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
      NEW.horario_padrao,
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
export const SQL_TRIGGER_PET_REMARCACAO_DESATIVAR = `
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

export const SQL_TRIGGER_OWNER_DESATIVAR_PETS = `
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

export const SQL_TRIGGER_PET_ATIVAR_OWNER = `
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

export const SQL_TRIGGER_PET_DESATIVAR_LIMPAR_REMARCACAO = `
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

// Antes das migrações, os triggers eram criados com IF NOT EXISTS, então um aparelho pode ter os de
// uma versão mais antiga do app. A versão 1 apaga e cria de novo, para todo banco na versão 1 ter os
// mesmos triggers. As tabelas ficam, porque guardam os dados.
export const SQL_DROP_TRIGGERS_V1 = `
  DROP TRIGGER IF EXISTS trg_ultima_visita;
  DROP TRIGGER IF EXISTS trg_remarcacao_automatica;
  DROP TRIGGER IF EXISTS trg_pet_remarcacao_insert;
  DROP TRIGGER IF EXISTS trg_pet_remarcacao_ativar;
  DROP TRIGGER IF EXISTS trg_pet_remarcacao_desativar;
  DROP TRIGGER IF EXISTS trg_owner_desativar_pets;
  DROP TRIGGER IF EXISTS trg_pet_ativar_owner;
  DROP TRIGGER IF EXISTS trg_pet_desativar_limpar_remarcacao;
`;


export const V1: Migration = {
  // Tabelas, índices e dados iniciais usam IF NOT EXISTS e INSERT OR IGNORE, então a mesma versão
  // cria o banco novo e marca o que já existia sem versão, sem perder dados.
  version: 1,
  statements: [
    SQL_CREATE_TABLES,
    SQL_CREATE_INDEXES,
    SQL_INSERTS,
    SQL_DROP_TRIGGERS_V1,
    SQL_TRIGGER_ULTIMA_VISITA,
    SQL_TRIGGER_REMARCACAO_AUTOMATICA,
    SQL_TRIGGER_PET_REMARCACAO_INSERT,
    SQL_TRIGGER_PET_REMARCACAO_ATIVAR,
    SQL_TRIGGER_PET_REMARCACAO_DESATIVAR,
    SQL_TRIGGER_OWNER_DESATIVAR_PETS,
    SQL_TRIGGER_PET_ATIVAR_OWNER,
    SQL_TRIGGER_PET_DESATIVAR_LIMPAR_REMARCACAO,
  ],
};