// SQL dos relatórios sem depender do Expo: o ReportsRepository e os testes executam os mesmos
// comandos. O que muda de uma chamada para outra entra por parâmetro `?`, nunca no texto. Desde a
// versão 3 do esquema, as datas são texto "AAAA-MM-DD", que se compara e se ordena como texto e entra
// direto nas funções de data do SQLite.
//
// As contagens devolvem `category` (o que agrupa: dia da semana, hora, mês...) e `total`, o formato
// que o countsToBars (src/utils/reports/charts.ts) transforma em barras.

/** Agendamentos concluídos por dia da semana, de 0 (domingo) a 6 (sábado). Sem parâmetros. */
export const COMPLETED_BY_WEEKDAY_SQL = `
  SELECT weekday AS category, COUNT(*) AS total
  FROM appointments
  WHERE completed = 1
  GROUP BY weekday
  ORDER BY weekday ASC`;

/** Agendamentos concluídos pela hora cheia do horário "HH:MM", de 0 a 23. Sem parâmetros. */
export const COMPLETED_BY_HOUR_SQL = `
  SELECT CAST(substr(time, 1, 2) AS INTEGER) AS category, COUNT(*) AS total
  FROM appointments
  WHERE completed = 1
  GROUP BY category
  ORDER BY category ASC`;

/** Agendamentos manuais (0) e automáticos (1). Parâmetro: concluido (0 ou 1). */
export const APPOINTMENTS_BY_ORIGIN_SQL = `
  SELECT is_auto AS category, COUNT(*) AS total
  FROM appointments
  WHERE completed = ?
  GROUP BY is_auto
  ORDER BY is_auto ASC`;

/**
 * Atendimentos por mês, como "AAAA-MM". Parâmetros: concluido (0 ou 1), a data inicial e a final.
 * Usa o idx_appointments_mensal (concluido, data): igualdade no concluido e intervalo na data.
 */
export const APPOINTMENTS_BY_MONTH_SQL = `
  SELECT substr(date, 1, 7) AS category, COUNT(*) AS total
  FROM appointments
  WHERE completed = ?
    AND date BETWEEN ? AND ?
  GROUP BY category
  ORDER BY category ASC`;

/** Pets ativos com a remarcação ligada (1) e desligada (0). Sem parâmetros. */
export const PETS_BY_RESCHEDULE_SQL = `
  SELECT reschedule_active AS category, COUNT(*) AS total
  FROM pets
  WHERE is_active = 1
  GROUP BY reschedule_active`;

/**
 * Pets ativos em cada pacote de remarcação (2 ou 4 por mês). Sem parâmetros.
 * Usa o idx_pets_ausentes (reschedule_active, is_active, last_visit_date).
 */
export const ACTIVE_PACKAGES_SQL = `
  SELECT package_frequency AS category, COUNT(*) AS total
  FROM pets
  WHERE reschedule_active = 1
    AND is_active = 1
    AND package_frequency IS NOT NULL
  GROUP BY package_frequency
  ORDER BY package_frequency ASC`;

/** Nomes dos pets ativos num pacote, em ordem alfabética. Parâmetro: o pacote (2 ou 4). */
export const PETS_IN_PACKAGE_SQL = `
  SELECT name
  FROM pets
  WHERE reschedule_active = 1
    AND is_active = 1
    AND package_frequency = ?
  ORDER BY name ASC`;

/**
 * Pets ativos há mais tempo sem visita. Quem nunca veio conta desde o cadastro. Parâmetros: o "hoje"
 * do app, no fuso do aparelho (BUG-7), reschedule_active (0 ou 1) e o limite de linhas.
 * Usa o idx_pets_ausentes (reschedule_active, is_active, last_visit_date).
 */
export const ABSENT_PETS_SQL = `
  SELECT
    substr(p.name, 1, 10) || ' · ' || substr(o.name, 1, 8)  AS label,
    MAX(0, CAST(
      julianday(?) - julianday(COALESCE(p.last_visit_date, p.created_at))
    AS INTEGER))                                            AS days_absent
  FROM pets p
  JOIN owners o ON o.id = p.owner_id
  WHERE p.reschedule_active = ?
    AND p.is_active = 1
  ORDER BY p.last_visit_date ASC
  LIMIT ?`;
