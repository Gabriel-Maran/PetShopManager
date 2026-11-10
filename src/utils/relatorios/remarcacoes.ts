import { getDatabase } from "../../config/database";
import { BarChartItem } from "../../view/components/Relatorios/BarChart";

export async function comparativoRemarcacao(): Promise<BarChartItem[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    remarcacao_ativa: number;
    total: number;
  }>(
    `SELECT remarcacao_ativa, COUNT(*) AS total
     FROM pets
     WHERE is_ativo = 1
     GROUP BY remarcacao_ativa`,
  );

  // Garante que os dois grupos aparecem mesmo se um deles for zero
  const mapa = new Map(rows.map((r) => [r.remarcacao_ativa, r.total]));

  return [
    { x: "Com remarcação", y: mapa.get(1) ?? 0 },
    { x: "Sem remarcação", y: mapa.get(0) ?? 0 },
  ];
}
