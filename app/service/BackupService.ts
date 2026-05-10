import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { getDatabase } from "../config/database";

const DB_NAME = "petshop.db";
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;
const BACKUP_PATH = `${FileSystem.cacheDirectory}${DB_NAME}`;

const TABELAS = [
  "configs",
  "service_type",
  "species",
  "race",
  "owners",
  "pets",
  "appointments",
];

// ─── EXPORTAR ────────────────────────────────────────────────────────────────

export async function exportDatabase(): Promise<void> {
  // Força o WAL a ser consolidado antes de copiar
  const db = await getDatabase();
  await db.execAsync(`PRAGMA wal_checkpoint(TRUNCATE);`);

  const dbInfo = await FileSystem.getInfoAsync(DB_PATH);
  if (!dbInfo.exists) {
    throw new Error("Banco de dados não encontrado.");
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Compartilhamento não disponível neste dispositivo.");
  }

  const backupInfo = await FileSystem.getInfoAsync(BACKUP_PATH);
  if (backupInfo.exists) {
    await FileSystem.deleteAsync(BACKUP_PATH, { idempotent: true });
  }

  await FileSystem.copyAsync({ from: DB_PATH, to: BACKUP_PATH });

  await Sharing.shareAsync(BACKUP_PATH, {
    mimeType: "application/octet-stream",
    dialogTitle: "Exportar banco de dados",
    UTI: "public.database",
  });
}

// ─── IMPORTAR ────────────────────────────────────────────────────────────────

export async function importDatabase(): Promise<void> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    copyToCacheDirectory: true,
  });

  if (result.canceled) return;

  const file = result.assets[0];

  if (!file.name.endsWith(".db")) {
    throw new Error("Arquivo inválido. Selecione um arquivo .db válido.");
  }

  const sourceInfo = await FileSystem.getInfoAsync(file.uri);
  if (!sourceInfo.exists) {
    throw new Error("Arquivo selecionado não encontrado ou inacessível.");
  }

  // Copia o .db importado para um caminho acessível pelo SQLite
  const IMPORT_PATH = `${FileSystem.documentDirectory}SQLite/import_temp.db`;
  const importInfo = await FileSystem.getInfoAsync(IMPORT_PATH);
  if (importInfo.exists) {
    await FileSystem.deleteAsync(IMPORT_PATH, { idempotent: true });
  }
  await FileSystem.copyAsync({ from: file.uri, to: IMPORT_PATH });

  const db = await getDatabase();

  // ATTACH abre o banco importado como "src" dentro da conexão ativa
  await db.execAsync(
    `ATTACH DATABASE '${IMPORT_PATH.replace("file://", "")}' AS src;`,
  );

  try {
    await db.execAsync(`PRAGMA foreign_keys = OFF;`);
    await db.execAsync(`BEGIN TRANSACTION;`);

    for (const tabela of TABELAS) {
      await db.execAsync(`DELETE FROM main.${tabela};`);
      await db.execAsync(
        `INSERT INTO main.${tabela} SELECT * FROM src.${tabela};`,
      );
    }

    await db.execAsync(`COMMIT;`);
  } catch (e) {
    await db.execAsync(`ROLLBACK;`);
    throw e;
  } finally {
    await db.execAsync(`PRAGMA foreign_keys = ON;`);
    await db.execAsync(`DETACH DATABASE src;`);
    await FileSystem.deleteAsync(IMPORT_PATH, { idempotent: true });
  }
}
