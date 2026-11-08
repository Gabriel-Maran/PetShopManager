import * as SQLite from "expo-sqlite";
import { migrateDatabase } from "./migrator";
import { MIGRATIONS, SQL_CONNECTION_PRAGMAS } from "./schema";

let db: SQLite.SQLiteDatabase | null = null;

/** A conexão do app, aberta uma vez, com o WAL e os pragmas que os triggers esperam. */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync("petshop.db");
    await db.execAsync(`PRAGMA journal_mode = WAL;`);
    await db.execAsync(SQL_CONNECTION_PRAGMAS);
  }
  return db;
}

/**
 * Leva o banco do aparelho até a última versão do esquema (schema.ts). Uma falha chega à tela de
 * erro do App.tsx, em vez de o app abrir com o banco pela metade.
 */
export async function initDatabase(): Promise<void> {
  await migrateDatabase(await getDatabase(), MIGRATIONS);
}
