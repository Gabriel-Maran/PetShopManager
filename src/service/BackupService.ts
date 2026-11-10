import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import {
  DATABASE_NAME,
  getDatabase,
  restoreAppDatabase,
  upgradeBackupFile,
} from "../config/database";
import { AppError } from "../errors/AppError";
import { MESSAGES } from "../globals/messages";
import { todayIso } from "../utils/datas";

// A pasta onde o expo-sqlite abre os bancos pelo nome.
const SQLITE_DIRECTORY = new Directory(Paths.document, "SQLite");
const DB_FILE = new File(SQLITE_DIRECTORY, DATABASE_NAME);

/** A extensão que a exportação grava e a importação aceita. */
const BACKUP_EXTENSION = ".db";

// As cópias exportadas ficam numa pasta só delas no cache. O compartilhamento termina quando o menu
// fecha, mas o app de destino (Drive, WhatsApp) pode ler o arquivo depois disso. Por isso a cópia não
// é apagada logo depois de compartilhar, e sim na exportação seguinte: fica no máximo uma.
const EXPORT_DIRECTORY = new Directory(Paths.cache, "backups");
// Onde as versões anteriores do app deixavam a cópia, com nome fixo.
const LEGACY_EXPORT_FILE = new File(Paths.cache, DATABASE_NAME);

/** "petshop-2026-11-09.db": a data ajuda a achar o backup certo entre vários. */
const exportFileName = () => `petshop-${todayIso()}${BACKUP_EXTENSION}`;

// A cópia do arquivo importado, na pasta dos bancos, para o expo-sqlite conseguir abri-la.
const IMPORT_NAME = "import_temp.db";
const IMPORT_FILE = new File(SQLITE_DIRECTORY, IMPORT_NAME);

// O banco e os arquivos que o SQLite cria ao lado dele enquanto está aberto.
const SQLITE_FILE_SUFFIXES = ["", "-wal", "-shm", "-journal"];

// ─── EXPORTAR ────────────────────────────────────────────────────────────────

export async function exportDatabase(): Promise<void> {
  // Força o WAL a ser consolidado antes de copiar
  const db = await getDatabase();
  await db.execAsync(`PRAGMA wal_checkpoint(TRUNCATE);`);

  if (!DB_FILE.exists) {
    throw new AppError("UNAVAILABLE", MESSAGES.backup.databaseNotFound);
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new AppError("UNAVAILABLE", MESSAGES.backup.sharingUnavailable);
  }

  deletePreviousExports();
  EXPORT_DIRECTORY.create({ intermediates: true, idempotent: true });
  const exportFile = new File(EXPORT_DIRECTORY, exportFileName());
  await DB_FILE.copy(exportFile);

  await Sharing.shareAsync(exportFile.uri, {
    mimeType: "application/octet-stream",
    dialogTitle: "Exportar banco de dados",
    UTI: "public.database",
  });
}

function deletePreviousExports(): void {
  deleteIfExists(EXPORT_DIRECTORY);
  deleteIfExists(LEGACY_EXPORT_FILE);
}

/** Na API nova o delete falha se o item não existe; aqui a ausência é o resultado esperado. */
function deleteIfExists(item: File | Directory): void {
  if (item.exists) item.delete();
}

// ─── IMPORTAR ────────────────────────────────────────────────────────────────

/** Devolve se importou: com a escolha do arquivo cancelada, nada muda e a tela fica onde está. */
export async function importDatabase(): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    copyToCacheDirectory: true,
  });

  if (result.canceled) return false;

  const file = result.assets[0];

  if (!file.name.endsWith(BACKUP_EXTENSION)) {
    throw new AppError("INVALID_BACKUP", MESSAGES.backup.wrongExtension);
  }

  if (!new File(file.uri).exists) {
    throw new AppError("INVALID_BACKUP", MESSAGES.backup.fileNotFound);
  }

  // A cópia é atualizada antes de entrar: um backup de versão anterior chega no formato de hoje, e
  // um arquivo que não é backup do app, ou que é de uma versão mais nova, é recusado sem mexer nos
  // dados. Com qualquer resultado, a cópia é apagada.
  deleteImportCopy();
  try {
    await new File(file.uri).copy(IMPORT_FILE);
    await upgradeBackupFile(IMPORT_NAME);
    await restoreAppDatabase(IMPORT_FILE.uri.replace("file://", ""));
  } finally {
    deleteImportCopy();
  }
  return true;
}

function deleteImportCopy(): void {
  for (const suffix of SQLITE_FILE_SUFFIXES) {
    deleteIfExists(new File(SQLITE_DIRECTORY, `${IMPORT_NAME}${suffix}`));
  }
}
