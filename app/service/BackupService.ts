import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { closeDatabase, initDatabase } from "../config/database";

const DB_NAME = "petshop.db";
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;
const BACKUP_PATH = `${FileSystem.cacheDirectory}${DB_NAME}`;

// ─── EXPORTAR ────────────────────────────────────────────────────────────────

export async function exportDatabase(): Promise<void> {
  const dbInfo = await FileSystem.getInfoAsync(DB_PATH);
  if (!dbInfo.exists) {
    throw new Error("Banco de dados não encontrado.");
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Compartilhamento não disponível neste dispositivo.");
  }

  // Garante que o backup anterior não interfere
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

  // Normaliza o URI removendo o prefixo file:// se presente
  const sourceUri = file.uri.startsWith("file://")
    ? file.uri.slice(7)
    : file.uri;

  // Verifica se o arquivo fonte existe e é acessível
  const sourceInfo = await FileSystem.getInfoAsync(file.uri);
  if (!sourceInfo.exists) {
    throw new Error("Arquivo selecionado não encontrado ou inacessível.");
  }

  // Fecha e reseta o singleton antes de substituir o arquivo
  await closeDatabase();

  // Garante que o diretório SQLite existe
  const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
  const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
  }

  // Remove o banco atual antes de copiar
  await FileSystem.deleteAsync(DB_PATH, { idempotent: true });

  await FileSystem.copyAsync({ from: file.uri, to: DB_PATH });

  // Verifica se a cópia foi bem-sucedida antes de reinicializar
  const newDbInfo = await FileSystem.getInfoAsync(DB_PATH);
  if (!newDbInfo.exists) {
    throw new Error("Falha ao copiar o arquivo. Tente novamente.");
  }

  await initDatabase();
}
