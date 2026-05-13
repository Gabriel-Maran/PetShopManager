import { getDatabase } from "../../config/database";
import { BarChartItem } from "../../view/components/Relatorios/BarChart";

const LEGENDAS = ["Manual", "Automático"] as const;

async function fetchAutoVsManuais(concluido: 0 | 1): Promise<BarChartItem[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{ is_auto_agen: number; total: number }>(`
    SELECT is_auto_agen, COUNT(*) AS total
    FROM appointments
    WHERE concluido = ${concluido}
    GROUP BY is_auto_agen
    ORDER BY is_auto_agen ASC
  `);

  const mapa = new Map(rows.map((r) => [r.is_auto_agen, r.total]));

  return LEGENDAS.map((label, index) => ({
    x: label,
    y: mapa.get(index) ?? 0,
  }));
}

// ─── Agendamentos concluídos: manuais vs automáticos ──────────────────────────
export async function autoVsManuaisConcluidos(): Promise<BarChartItem[]> {
  return fetchAutoVsManuais(1);
}

// ─── Agendamentos ainda pendentes: manuais vs automáticos ─────────────────────
export async function autoVsManuaisAgendados(): Promise<BarChartItem[]> {
  return fetchAutoVsManuais(0);
}
