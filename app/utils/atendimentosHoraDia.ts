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

export async function getHorasMaisAtendidas(): Promise<BarChartItem[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{ hora_inteira: number; total: number }>(`
  SELECT 
    CAST(substr(hora, 1, 2) AS INTEGER) AS hora_inteira, 
    COUNT(*) AS total
  FROM appointments
  WHERE concluido = 1
  GROUP BY CAST(substr(hora, 1, 2) AS INTEGER) -- Garante o uso do índice
  ORDER BY hora_inteira ASC
`);

  const mapa = new Map(rows.map((r) => [r.hora_inteira, r.total]));

  return Array.from({ length: 24 }, (_, i) => ({
    x: `${i.toString().padStart(2, "0")}h`,
    y: mapa.get(i) ?? 0,
  }));
}
