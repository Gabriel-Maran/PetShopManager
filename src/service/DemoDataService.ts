import { getDatabase, recreateAppDatabase } from "../config/database";
import { buildDemoDataSql, COUNT_USER_DATA_SQL } from "../config/demoData";
import { normalizeForSearch } from "../utils/formatters/normalizeForSearch";
import { AppError } from "../errors/AppError";
import { MESSAGES } from "../globals/messages";

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
      throw new AppError("CONFLICT", MESSAGES.demoData.notEmpty);
    }
    await db.execAsync(buildDemoDataSql({ today, normalize: normalizeForSearch }));
  });
}

/**
 * Só no modo de desenvolvimento: apaga todos os dados, recria o banco pelas migrações e carrega os
 * dados de exemplo. As configurações, como o tema, voltam ao padrão. A checagem fica aqui, e não só
 * na tela, para nenhum outro caminho apagar os dados de um aparelho de verdade.
 */
export async function resetToDemoData(today: Date = new Date()): Promise<void> {
  if (!__DEV__) {
    throw new AppError("UNAVAILABLE", MESSAGES.demoData.resetDevOnly);
  }
  await recreateAppDatabase();
  await loadDemoData(today);
}
