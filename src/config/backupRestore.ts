// Restauração de backup sem depender do Expo: o app (database.ts) e os testes rodam este mesmo código.
// O backup escolhido é copiado para a pasta do app, conferido e atualizado pelas mesmas migrações do
// banco do aparelho. Só depois os dados entram no app, com a cópia anexada como "src". Os imports levam
// a extensão .ts porque o Node dos testes exige.
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
  COPY_ID_SEQUENCES_SQL,
  copyTableSql,
  DETACH_BACKUP_SQL,
  dropTriggerSql,
  INTEGRITY_CHECK_SQL,
  LIST_APP_TRIGGERS_SQL,
  LIST_TABLES_SQL,
  REQUIRED_BACKUP_TABLES,
  tableColumnsSql,
} from "../repository/sql/backupSql.ts";
import { AppError } from "../errors/AppError.ts";
import { MESSAGES } from "../globals/messages.ts";

/** A conexão do app na restauração: a das migrações, mais um comando com parâmetros. */
export interface RestoreDatabase extends MigrationDatabase {
  runAsync(sql: string, ...params: string[]): Promise<unknown>;
}

/**
 * Leva a cópia do backup até a última versão do esquema, numa conexão só dela, para um backup de
 * versão anterior entrar no formato de hoje. Recusa, antes de mexer, um arquivo danificado, sem as
 * tabelas do app ou de versão mais nova. Devolve a versão final.
 */
export async function upgradeBackup(
  backup: MigrationDatabase,
  migrations: readonly Migration[],
): Promise<number> {
  await assertIntact(backup);
  // Sem esta checagem, as migrações criariam as tabelas vazias num arquivo qualquer, e a restauração
  // apagaria os dados do app.
  const tables = await listTables(backup);
  if (!REQUIRED_BACKUP_TABLES.some((required) => required.every((table) => tables.has(table)))) {
    throw new AppError("INVALID_BACKUP", MESSAGES.backup.notABackup);
  }
  // O migrateDatabase também recusa, mas com a mensagem da abertura do app, que fala dos dados do
  // aparelho, e não do arquivo escolhido.
  if ((await readUserVersion(backup)) > migrations.length) {
    throw new AppError("INVALID_BACKUP", MESSAGES.backup.newerVersion);
  }
  return migrateDatabase(backup, migrations);
}

async function assertIntact(backup: MigrationDatabase): Promise<void> {
  let result: string | undefined;
  try {
    const row = await backup.getFirstAsync<{ integrity_check: string }>(INTEGRITY_CHECK_SQL);
    result = row?.integrity_check;
  } catch (cause) {
    // A primeira leitura do arquivo: falha aqui o que nem é banco SQLite e o esquema que tenta usar
    // uma função barrada pelo trusted_schema (schema.ts).
    throw new AppError("INVALID_BACKUP", MESSAGES.backup.notABackup, { cause });
  }
  if (result !== "ok") {
    const cause = new Error(`integrity_check: ${result}`);
    throw new AppError("INVALID_BACKUP", MESSAGES.backup.damaged, { cause });
  }
}

async function listTables(backup: MigrationDatabase): Promise<Set<string>> {
  const rows = await backup.getAllAsync<{ name: string }>(LIST_TABLES_SQL);
  return new Set(rows.map(({ name }) => name));
}

/**
 * Troca os dados do app pelos do backup, já atualizado pelo upgradeBackup, numa transação só: se a
 * cópia de uma tabela falhar, o app fica como estava. Os dados entram como estão no backup, sem passar
 * pelos triggers do app.
 */
export async function restoreBackup(db: RestoreDatabase, backupPath: string): Promise<void> {
  await db.runAsync(ATTACH_BACKUP_SQL, backupPath);
  try {
    const copies = await planTableCopies(db);
    await withForeignKeysOff(db, () =>
      inTransaction(db, () =>
        withoutAppTriggers(db, async () => {
          for (const { table, columns } of copies) {
            await db.execAsync(clearTableSql(table));
            await db.execAsync(copyTableSql(table, columns));
          }
          await db.execAsync(COPY_ID_SEQUENCES_SQL);
        }),
      ),
    );
  } finally {
    await db.execAsync(DETACH_BACKUP_SQL);
  }
}

interface TableCopy {
  table: string;
  columns: string[];
}

/**
 * As colunas copiadas são as que o app tem hoje. O backup já está na mesma versão (upgradeBackup), então
 * só um arquivo montado fora do app fica sem alguma delas, e ele é recusado antes de mexer nos dados.
 */
async function planTableCopies(db: MigrationDatabase): Promise<TableCopy[]> {
  const copies: TableCopy[] = [];
  for (const table of BACKUP_TABLES) {
    const columns = await columnsOf(db, "main", table);
    const backupColumns = new Set(await columnsOf(db, "src", table));
    if (!columns.every((column) => backupColumns.has(column))) {
      throw new AppError("INVALID_BACKUP", MESSAGES.backup.notABackup);
    }
    copies.push({ table, columns });
  }
  return copies;
}

async function columnsOf(db: MigrationDatabase, schema: "main" | "src", table: string) {
  const rows = await db.getAllAsync<{ name: string }>(tableColumnsSql(schema, table));
  return rows.map(({ name }) => name);
}

// Os triggers são as regras do dia a dia: desativar o dono, por exemplo, desativa os pets e limpa o
// pacote deles. Na restauração, os dados já vêm prontos do backup, com a agenda e o ponteiro da
// remarcação (last_auto_visit_date). Desde a versão 4 do esquema, a agenda nem é mais de trigger,
// mas a regra vale para qualquer trigger: eles saem durante a cópia e voltam iguais, na mesma ordem,
// pelo comando guardado no próprio banco do app. Roda dentro da transação: se a cópia falhar, o
// ROLLBACK traz os triggers de volta.
async function withoutAppTriggers(db: MigrationDatabase, work: () => Promise<void>) {
  const triggers = await db.getAllAsync<{ name: string; sql: string }>(LIST_APP_TRIGGERS_SQL);
  for (const { name } of triggers) {
    await db.execAsync(dropTriggerSql(name));
  }
  await work();
  for (const { sql } of triggers) {
    await db.execAsync(sql);
  }
}
