// Versão 2 do esquema: BUG-3 e BUG-4. Não mude este arquivo: uma versão publicada não muda mais.
import type { Migration } from "../migrator";
import { PERIODO_REMARCACAO } from "./v1.ts";

// ── Versão 2: BUG-3 e BUG-4 ───────────────────────────────────────────────
// No SQLite, um trigger "AFTER UPDATE OF coluna" dispara sempre que o UPDATE cita a coluna, mesmo
// sem mudar o valor. Os formulários do app regravam todos os campos, então as condições abaixo
// comparam o valor antigo (OLD) com o novo (NEW).

// BUG-3: só a passagem de pendente para concluído conta como conclusão. Salvar de novo um
// agendamento já concluído (para marcar como pago, por exemplo) não mexe mais na última visita.
export const SQL_TRIGGER_ULTIMA_VISITA_V2 = `
  DROP TRIGGER IF EXISTS trg_ultima_visita;
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

// BUG-3: o mesmo corpo da versão 1, mas só cria o próximo agendamento na passagem de pendente para
// concluído. Antes, salvar de novo um automático concluído criava mais um.
export const SQL_TRIGGER_REMARCACAO_AUTOMATICA_V2 = `
  DROP TRIGGER IF EXISTS trg_remarcacao_automatica;
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

// BUG-4: a agenda só é refeita quando muda de fato um campo que entra nela: ligar o pacote, trocar o
// pacote, a data de início, o horário, o serviço ou o valor, ou reativar o pet (decisão do Gabriel em
// 2026-11-08). Editar nome, observação ou raça não mexe mais na agenda.
// Ao refazer, só os automáticos pendentes de hoje em diante são apagados e gerados de novo. Os que já
// passaram e os concluídos ficam como estão, e nenhuma data passada é criada de novo.
export const SQL_TRIGGER_PET_REMARCACAO_ATIVAR_V2 = `
  DROP TRIGGER IF EXISTS trg_pet_remarcacao_ativar;
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
    -- Apaga só os automáticos pendentes de hoje em diante
    DELETE FROM appointments
    WHERE pet_id = NEW.id
      AND is_auto_agen = 1
      AND concluido = 0
      AND data >= CAST(strftime('%Y%m%d', 'now', 'localtime') AS INTEGER);

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
      1,
      -- Valor por atendimento = valor_pacote ÷ pacote_remarcacao
      replace(printf('%.2f',
        CAST(replace(NEW.valor_pacote, ',', '.') AS REAL) / NEW.pacote_remarcacao
      ), '.', ',')
    FROM agenda
    WHERE data_int >= CAST(strftime('%Y%m%d', 'now', 'localtime') AS INTEGER)
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

export const V2: Migration = {
  // Os triggers só agem quando o valor muda de fato.
  version: 2,
  statements: [
    SQL_TRIGGER_ULTIMA_VISITA_V2,
    SQL_TRIGGER_REMARCACAO_AUTOMATICA_V2,
    SQL_TRIGGER_PET_REMARCACAO_ATIVAR_V2,
  ],
};
