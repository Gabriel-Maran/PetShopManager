// SQL dos relatórios sem depender do Expo: os relatórios (app/utils/relatorios) e os testes executam
// os mesmos comandos. Desde a versão 3 do esquema, as datas são texto "AAAA-MM-DD", que se compara e
// se ordena como texto e entra direto nas funções de data do SQLite.

/**
 * Atendimentos por mês, como "AAAA-MM". Parâmetros: concluido (0 ou 1), a data inicial e a final.
 * Usa o idx_appointments_mensal (concluido, data): igualdade no concluido e intervalo na data.
 */
export const APPOINTMENTS_BY_MONTH_SQL = `
  SELECT
    substr(data, 1, 7) AS ano_mes,
    COUNT(*)           AS total
  FROM appointments
  WHERE concluido = ?
    AND data BETWEEN ? AND ?
  GROUP BY ano_mes
  ORDER BY ano_mes ASC`;

/**
 * Pets ativos há mais tempo sem visita. Quem nunca veio conta desde o cadastro. Parâmetros: o "hoje"
 * do app, no fuso do aparelho (BUG-7), remarcacao_ativa (0 ou 1) e o limite de linhas.
 * Usa o idx_pets_ausentes (remarcacao_ativa, is_ativo, current_ultima_visita_data).
 */
export const PETS_AUSENTES_SQL = `
  SELECT
    p.id                                                    AS pet_id,
    substr(p.nome, 1, 10) || ' · ' || substr(o.nome, 1, 8)  AS label,
    MAX(0, CAST(
      julianday(?) - julianday(COALESCE(p.current_ultima_visita_data, p.criado_em))
    AS INTEGER))                                            AS dias_ausente,
    p.current_ultima_visita_data                            AS ultima_visita,
    o.telefone                                              AS dono_telefone
  FROM pets p
  JOIN owners o ON o.id = p.dono_id
  WHERE p.remarcacao_ativa = ?
    AND p.is_ativo = 1
  ORDER BY p.current_ultima_visita_data ASC
  LIMIT ?`;
