import { getDatabase } from "../../config/database";
import { BarChartItem } from "../../view/components/Relatorios/BarChart";

// ─── Labels dos meses em ────────────────────────────────────────────────

const MESES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

// ─── Helper: gera os últimos N meses como "YYYYMM" ───────────────────────────
// Ex: se hoje é Mai/2026, retorna ["202606","202607",...,"202605"] (12 itens)
function gerarUltimosMeses(quantidade = 12): string[] {
  const meses: string[] = [];
  const hoje = new Date();

  for (let i = quantidade - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    meses.push(`${ano}${mes}`);
  }

  return meses;
}

// ─── Helper: "202504" → "Abr/25" ─────────────────────────────────────────────
function formatarMes(anoMes: string): string {
  const mes = parseInt(anoMes.slice(4, 6), 10) - 1; // 0-based
  const ano = anoMes.slice(2, 4); // 2 dígitos
  return `${MESES[mes]}/${ano}`;
}

// ─── Comparativo mensal ───────────────────────────────────────────────────────

export interface ComparativoMensalItem extends BarChartItem {
  // x = "Abr/25"   y = total de atendimentos
  anoMes: string; // "YYYYMM" — útil para drill-down futuro
}

/**
 * Retorna os atendimentos concluídos agrupados por mês,
 * garantindo que todos os 12 meses apareçam (y = 0 nos meses sem dados).
 *
 * Usa: idx_appointments_mensal (concluido, data)
 * → igualdade em concluido=1, range scan em data, sem sort extra
 */
export async function getComparativoMensal(
  meses = 12,
): Promise<ComparativoMensalItem[]> {
  const db = await getDatabase();

  // Data de corte: primeiro dia do mês mais antigo do período, formato YYYYMMDD
  const d = new Date();
  d.setMonth(d.getMonth() - (meses - 1));
  d.setDate(1);
  const dataCorte = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + 1; // sempre dia 01

  // substr(data, 1, 6) extrai "YYYYMM" diretamente do inteiro YYYYMMDD
  // idx_appointments_mensal (concluido, data) cobre o WHERE e ordena o GROUP BY
  const rows = await db.getAllAsync<{ ano_mes: string; total: number }>(`
    SELECT
      substr(CAST(data AS TEXT), 1, 6) AS ano_mes,
      COUNT(*)                         AS total
    FROM appointments
    WHERE concluido = 1
      AND data >= ${dataCorte}
    GROUP BY ano_mes
    ORDER BY ano_mes ASC
  `);

  const mapa = new Map(rows.map((r) => [r.ano_mes, r.total]));
  const todosMeses = gerarUltimosMeses(meses);

  return todosMeses.map((anoMes) => ({
    x: formatarMes(anoMes),
    y: mapa.get(anoMes) ?? 0,
    anoMes,
  }));
}

/**
 * Variante: comparativo de agendamentos futuros/pendentes por mês
 * (útil para visualizar a demanda prevista nos próximos meses)
 *
 * Usa o mesmo índice idx_appointments_mensal (concluido, data)
 */
export async function getComparativoMensalAgendados(
  meses = 12,
): Promise<ComparativoMensalItem[]> {
  const db = await getDatabase();

  const hoje = new Date();
  const dataHoje =
    hoje.getFullYear() * 10000 + (hoje.getMonth() + 1) * 100 + hoje.getDate();

  // Último dia do período futuro
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + meses, 0);
  const dataFim =
    fim.getFullYear() * 10000 + (fim.getMonth() + 1) * 100 + fim.getDate();

  const rows = await db.getAllAsync<{ ano_mes: string; total: number }>(`
    SELECT
      substr(CAST(data AS TEXT), 1, 6) AS ano_mes,
      COUNT(*)                         AS total
    FROM appointments
    WHERE concluido = 0
      AND data >= ${dataHoje}
      AND data <= ${dataFim}
    GROUP BY ano_mes
    ORDER BY ano_mes ASC
  `);

  const mapa = new Map(rows.map((r) => [r.ano_mes, r.total]));

  // Gera os próximos N meses a partir do mês atual
  const proximosMeses: string[] = [];
  for (let i = 0; i < meses; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    proximosMeses.push(`${ano}${mes}`);
  }

  return proximosMeses.map((anoMes) => ({
    x: formatarMes(anoMes),
    y: mapa.get(anoMes) ?? 0,
    anoMes,
  }));
}
