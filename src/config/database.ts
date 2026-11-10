import * as SQLite from "expo-sqlite";
import { restoreBackup, upgradeBackup } from "./backupRestore";
import { migrateDatabase, recreateDatabase } from "./migrator";
import { MIGRATIONS, SQL_CONNECTION_PRAGMAS } from "./schema";

/** O arquivo do banco, na pasta SQLite do app. */
export const DATABASE_NAME = "petshop.db";

// Guarda a promessa, e não a conexão: na abertura do app, o tema e o initDatabase pedem o banco ao
// mesmo tempo, e os dois precisam receber a mesma conexão.
let connection: Promise<SQLite.SQLiteDatabase> | null = null;

/** A conexão do app, aberta uma vez, com o WAL e os pragmas que os triggers esperam. */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  connection ??= openDatabase().catch((error: unknown) => {
    // Sem isso, uma falha na abertura ficaria guardada, e a próxima chamada nem tentaria de novo.
    connection = null;
    throw error;
  });
  return connection;
}

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync(`PRAGMA journal_mode = WAL;`);
  await db.execAsync(SQL_CONNECTION_PRAGMAS);
  return db;
}

/**
 * Leva o banco do aparelho até a última versão do esquema (schema.ts). Uma falha chega à tela de
 * erro do App.tsx, em vez de o app abrir com o banco pela metade.
 */
export async function initDatabase(): Promise<void> {
  await migrateDatabase(await getDatabase(), MIGRATIONS);
}

/** Apaga todos os dados e recria o banco pelas migrações, como numa instalação nova. */
export async function recreateAppDatabase(): Promise<void> {
  await recreateDatabase(await getDatabase(), MIGRATIONS);
}

/**
 * Leva um backup copiado para a pasta SQLite do app até a última versão do esquema, numa conexão
 * só dele, aberta como a do app. A conexão é fechada no fim, para o arquivo poder ser anexado.
 */
export async function upgradeBackupFile(fileName: string): Promise<void> {
  const backup = await SQLite.openDatabaseAsync(fileName);
  try {
    await backup.execAsync(SQL_CONNECTION_PRAGMAS);
    await upgradeBackup(backup, MIGRATIONS);
  } finally {
    await backup.closeAsync();
  }
}

/** Troca os dados do app pelos do backup que o upgradeBackupFile já atualizou. */
export async function restoreAppDatabase(backupPath: string): Promise<void> {
  await restoreBackup(await getDatabase(), backupPath);
}
