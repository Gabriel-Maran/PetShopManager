import { getDatabase } from "../../config/database";
import { BarChartItem } from "../../view/components/Relatorios/BarChart";

export async function autoVsManuais(): Promise<BarChartItem[]> {
  const db = await getDatabase();

  // Busca a contagem agrupada por is_auto_agen (0 ou 1)
  const rows = await db.getAllAsync<{ is_auto_agen: number; total: number }>(`
    SELECT is_auto_agen, COUNT(*) AS total
    FROM appointments
    WHERE concluido = 1
    GROUP BY is_auto_agen
    ORDER BY is_auto_agen ASC
  `);

  // Cria um mapa onde a chave é 0 ou 1
  const mapa = new Map(rows.map((r) => [r.is_auto_agen, r.total]));

  // Define as legendas fixas para o gráfico de barras
  const LEGENDAS = ["Manual", "Automático"];

  // Retorna o array formatado para o componente de gráfico
  return LEGENDAS.map((label, index) => ({
    x: label,
    y: mapa.get(index) ?? 0, // index 0 = Manual, index 1 = Automático
  }));
}
