// Restauração de backup sem depender do Expo: o app (database.ts) e os testes rodam este mesmo código.
// O backup escolhido é copiado para a pasta do app e atualizado pelas mesmas migrações do banco do
// aparelho. Só depois os dados entram no app, com a cópia anexada como "src". Os imports levam a
// extensão .ts porque o Node dos testes exige.
import {
  inTransaction,
  migrateDatabase,
  readUserVersion,
  withForeignKeysOff,
  type Migration,
  type MigrationDatabase,
} from "./migrator.ts";
import {
  ATTACH_BACKUP_SQL,
  BACKUP_TABLES,
  clearTableSql,
  copyTableSql,
  DETACH_BACKUP_SQL,
  LIST_TABLES_SQL,
} from "../repository/sql/backupSql.ts";
import { AppError } from "../errors/AppError.ts";
import { MESSAGES } from "../globals/messages.ts";

/** A conexão do app na restauração: a das migrações, mais um comando com parâmetros. */
export interface RestoreDatabase extends MigrationDatabase {
  runAsync(sql: string, ...params: string[]): Promise<unknown>;
}

/**
 * Leva a cópia do backup até a última versão do esquema, numa conexão só dela, para um backup de
 * versão anterior entrar no formato de hoje. Recusa, antes de mexer, um arquivo sem as tabelas do
 * app e um backup de versão mais nova. Devolve a versão final.
 */
export async function upgradeBackup(
  backup: MigrationDatabase,
  migrations: readonly Migration[],
): Promise<number> {
  // Sem esta checagem, as migrações criariam as tabelas vazias num arquivo qualquer, e a restauração
  // apagaria os dados do app.
  const tables = await listTables(backup);
  if (!BACKUP_TABLES.every((table) => tables.has(table))) {
    throw new AppError("INVALID_BACKUP", MESSAGES.backup.notABackup);
  }
  // O migrateDatabase também recusa, mas com a mensagem da abertura do app, que fala dos dados do
  // aparelho, e não do arquivo escolhido.
  if ((await readUserVersion(backup)) > migrations.length) {
    throw new AppError("INVALID_BACKUP", MESSAGES.backup.newerVersion);
  }
  return migrateDatabase(backup, migrations);
}

async function listTables(backup: MigrationDatabase): Promise<Set<string>> {
  try {
    const rows = await backup.getAllAsync<{ name: string }>(LIST_TABLES_SQL);
    return new Set(rows.map(({ name }) => name));
  } catch (cause) {
    // Um arquivo que não é banco SQLite, ou que está corrompido, já falha nesta primeira leitura.
    throw new AppError("INVALID_BACKUP", MESSAGES.backup.notABackup, { cause });
  }
}

/**
 * Troca os dados do app pelos do backup, já atualizado pelo upgradeBackup, numa transação só: se a
 * cópia de uma tabela falhar, o app fica como estava.
 */
export async function restoreBackup(db: RestoreDatabase, backupPath: string): Promise<void> {
  await db.runAsync(ATTACH_BACKUP_SQL, backupPath);
  try {
    await withForeignKeysOff(db, () =>
      inTransaction(db, async () => {
        for (const table of BACKUP_TABLES) {
          await db.execAsync(clearTableSql(table));
          await db.execAsync(copyTableSql(table));
        }
      }),
    );
  } finally {
    await db.execAsync(DETACH_BACKUP_SQL);
  }
}
