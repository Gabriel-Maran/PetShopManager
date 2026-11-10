// SQL dos relatórios sem depender do Expo: o ReportsRepository e os testes executam os mesmos
// comandos. O que muda de uma chamada para outra entra por parâmetro `?`, nunca no texto. Desde a
// versão 3 do esquema, as datas são texto "AAAA-MM-DD", que se compara e se ordena como texto e entra
// direto nas funções de data do SQLite.
//
// As contagens devolvem `category` (o que agrupa: dia da semana, hora, mês...) e `total`, o formato
// que o countsToBars (src/utils/relatorios/graficos.ts) transforma em barras.

/** Agendamentos concluídos por dia da semana, de 0 (domingo) a 6 (sábado). Sem parâmetros. */
export const COMPLETED_BY_WEEKDAY_SQL = `
  SELECT dia_semana AS category, COUNT(*) AS total
  FROM appointments
  WHERE concluido = 1
  GROUP BY dia_semana
  ORDER BY dia_semana ASC`;

/** Agendamentos concluídos pela hora cheia do horário "HH:MM", de 0 a 23. Sem parâmetros. */
export const COMPLETED_BY_HOUR_SQL = `
  SELECT CAST(substr(hora, 1, 2) AS INTEGER) AS category, COUNT(*) AS total
  FROM appointments
  WHERE concluido = 1
  GROUP BY category
  ORDER BY category ASC`;

/** Agendamentos manuais (0) e automáticos (1). Parâmetro: concluido (0 ou 1). */
export const APPOINTMENTS_BY_ORIGIN_SQL = `
  SELECT is_auto_agen AS category, COUNT(*) AS total
  FROM appointments
  WHERE concluido = ?
  GROUP BY is_auto_agen
  ORDER BY is_auto_agen ASC`;

/**
 * Atendimentos por mês, como "AAAA-MM". Parâmetros: concluido (0 ou 1), a data inicial e a final.
 * Usa o idx_appointments_mensal (concluido, data): igualdade no concluido e intervalo na data.
 */
export const APPOINTMENTS_BY_MONTH_SQL = `
  SELECT substr(data, 1, 7) AS category, COUNT(*) AS total
  FROM appointments
  WHERE concluido = ?
    AND data BETWEEN ? AND ?
  GROUP BY category
  ORDER BY category ASC`;

/** Pets ativos com a remarcação ligada (1) e desligada (0). Sem parâmetros. */
export const PETS_BY_RESCHEDULE_SQL = `
  SELECT remarcacao_ativa AS category, COUNT(*) AS total
  FROM pets
  WHERE is_ativo = 1
  GROUP BY remarcacao_ativa`;

/**
 * Pets ativos em cada pacote de remarcação (2 ou 4 por mês). Sem parâmetros.
 * Usa o idx_pets_ausentes (remarcacao_ativa, is_ativo, current_ultima_visita_data).
 */
export const ACTIVE_PACKAGES_SQL = `
  SELECT pacote_remarcacao AS category, COUNT(*) AS total
  FROM pets
  WHERE remarcacao_ativa = 1
    AND is_ativo = 1
    AND pacote_remarcacao IS NOT NULL
  GROUP BY pacote_remarcacao
  ORDER BY pacote_remarcacao ASC`;

/** Nomes dos pets ativos num pacote, em ordem alfabética. Parâmetro: o pacote (2 ou 4). */
export const PETS_IN_PACKAGE_SQL = `
  SELECT nome
  FROM pets
  WHERE remarcacao_ativa = 1
    AND is_ativo = 1
    AND pacote_remarcacao = ?
  ORDER BY nome ASC`;

/**
 * Pets ativos há mais tempo sem visita. Quem nunca veio conta desde o cadastro. Parâmetros: o "hoje"
 * do app, no fuso do aparelho (BUG-7), remarcacao_ativa (0 ou 1) e o limite de linhas.
 * Usa o idx_pets_ausentes (remarcacao_ativa, is_ativo, current_ultima_visita_data).
 */
export const PETS_AUSENTES_SQL = `
  SELECT
    substr(p.nome, 1, 10) || ' · ' || substr(o.nome, 1, 8)  AS label,
    MAX(0, CAST(
      julianday(?) - julianday(COALESCE(p.current_ultima_visita_data, p.criado_em))
    AS INTEGER))                                            AS dias_ausente
  FROM pets p
  JOIN owners o ON o.id = p.dono_id
  WHERE p.remarcacao_ativa = ?
    AND p.is_ativo = 1
  ORDER BY p.current_ultima_visita_data ASC
  LIMIT ?`;
