import { getDatabase } from "../config/database";
import { BarChartItem } from "../view/components/Relatorios/BarChart";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export async function getDiasMaisAtendidos(): Promise<BarChartItem[]> {
  const db = await getDatabase();

  // Agora apenas selecionamos a coluna virtual dia_semana
  const rows = await db.getAllAsync<{ dia_semana: number; total: number }>(`
    SELECT dia_semana, COUNT(*) AS total
    FROM appointments
    WHERE concluido = 1
    GROUP BY dia_semana
    ORDER BY dia_semana ASC
  `);

  const mapa = new Map(rows.map((r) => [r.dia_semana, r.total]));

  return DIAS.map((label, index) => ({
    x: label,
    y: mapa.get(index) ?? 0,
  }));
}
