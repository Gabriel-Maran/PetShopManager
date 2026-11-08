import { getDatabase } from "../config/database";
import { buildDemoDataSql, COUNT_USER_DATA_SQL } from "../config/demoData";
import { normalizeForSearch } from "../utils/formatadores/normalizaNome";

export const DEMO_DATA_NOT_EMPTY_MESSAGE =
  "Os dados de exemplo só podem ser carregados com o app vazio, sem nenhum dono, pet ou agendamento.";

export async function isAppEmpty(): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(COUNT_USER_DATA_SQL);
  return (row?.total ?? 0) === 0;
}

/**
 * Preenche o app vazio com os dados de exemplo, numa transação só: se algo falhar, nada fica pela
 * metade. Usa a conexão do app, que já tem as chaves estrangeiras e os triggers recursivos ligados.
 */
export async function loadDemoData(today: Date = new Date()): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    // Confere de novo dentro da transação, para nunca misturar com dados de verdade.
    const row = await db.getFirstAsync<{ total: number }>(COUNT_USER_DATA_SQL);
    if ((row?.total ?? 0) > 0) {
      throw new Error(DEMO_DATA_NOT_EMPTY_MESSAGE);
    }
    await db.execAsync(buildDemoDataSql({ today, normalize: normalizeForSearch }));
  });
}
