// Migrações do banco sem depender do Expo: o app (database.ts) e os testes rodam este mesmo código.
// A versão do esquema fica no PRAGMA user_version, que o SQLite guarda no próprio arquivo do banco.

/**
 * Uma versão do esquema. As versões seguem em sequência a partir de 1. Uma migração que já chegou
 * a algum aparelho não muda mais: a correção entra como a versão seguinte.
 */
export interface Migration {
  version: number;
  /** Comandos SQL executados em ordem, dentro da transação das migrações. */
  statements: readonly string[];
}

/** A parte da conexão do expo-sqlite que as migrações usam. Nos testes, o node:sqlite faz esse papel. */
export interface MigrationDatabase {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
  getAllAsync<T>(sql: string): Promise<T[]>;
}

export const NEWER_DATABASE_MESSAGE =
  "Estes dados são de uma versão mais nova do app. Atualize o app para abri-los.";

export const BROKEN_FOREIGN_KEY_MESSAGE =
  "A migração deixou registros apontando para outros que não existem.";

export const migrationFailedMessage = (version: number) =>
  `A atualização do banco para a versão ${version} falhou, e nenhum dado foi alterado.`;

/**
 * Leva o banco até a última versão da lista numa transação só: ou todas as migrações pendentes
 * entram, ou nada muda. Devolve a versão final.
 */
export async function migrateDatabase(
  db: MigrationDatabase,
  migrations: readonly Migration[],
): Promise<number> {
  assertSequential(migrations);
  const current = await readPragma(db, "user_version");
  const latest = migrations.length;
  if (current > latest) {
    throw new Error(NEWER_DATABASE_MESSAGE);
  }

  const pending = migrations.slice(current);
  if (pending.length === 0) return current;

  await withForeignKeysOff(db, () =>
    inTransaction(db, () => applyMigrations(db, pending)),
  );
  return latest;
}

/**
 * Apaga todas as tabelas, com os dados, e cria o banco de novo pelas migrações, como numa
 * instalação nova. Tudo numa transação só: se algo falhar, os dados antigos continuam lá.
 * Devolve a versão final.
 */
export async function recreateDatabase(
  db: MigrationDatabase,
  migrations: readonly Migration[],
): Promise<number> {
  assertSequential(migrations);
  await withForeignKeysOff(db, () =>
    inTransaction(db, async () => {
      await dropAllTables(db);
      await applyMigrations(db, migrations);
    }),
  );
  return migrations.length;
}

function assertSequential(migrations: readonly Migration[]): void {
  migrations.forEach((migration, index) => {
    if (migration.version !== index + 1) {
      throw new Error(
        `Migração fora de ordem: a posição ${index + 1} tem a versão ${migration.version}.`,
      );
    }
  });
}

// Dentro de uma transação, o PRAGMA foreign_keys não tem efeito. Por isso ele é desligado antes:
// assim, reconstruir ou apagar uma tabela não dispara o ON DELETE CASCADE nas tabelas filhas.
// A restauração de backup (backupRestore.ts) usa o mesmo caminho.
export async function withForeignKeysOff(
  db: MigrationDatabase,
  work: () => Promise<void>,
): Promise<void> {
  const foreignKeysWereOn = (await readPragma(db, "foreign_keys")) === 1;
  await db.execAsync("PRAGMA foreign_keys = OFF;");
  try {
    await work();
  } finally {
    if (foreignKeysWereOn) await db.execAsync("PRAGMA foreign_keys = ON;");
  }
}

/** Roda `work` numa transação: se algo falhar, nada do que ele fez fica no banco. */
export async function inTransaction(
  db: MigrationDatabase,
  work: () => Promise<void>,
): Promise<void> {
  await db.execAsync("BEGIN IMMEDIATE;");
  try {
    await work();
    await db.execAsync("COMMIT;");
  } catch (error) {
    await rollbackQuietly(db);
    throw error;
  }
}

async function applyMigrations(
  db: MigrationDatabase,
  pending: readonly Migration[],
): Promise<void> {
  // A checagem compara com o que o banco já tinha, para um dado antigo inconsistente não impedir
  // o app de abrir. Só é recusada a migração que quebra uma referência nova.
  const violationsBefore = await countForeignKeyViolations(db);
  for (const migration of pending) {
    await applyMigration(db, migration, violationsBefore);
  }
}

async function applyMigration(
  db: MigrationDatabase,
  migration: Migration,
  violationsBefore: number,
): Promise<void> {
  try {
    for (const sql of migration.statements) {
      await db.execAsync(sql);
    }
    if ((await countForeignKeyViolations(db)) > violationsBefore) {
      throw new Error(BROKEN_FOREIGN_KEY_MESSAGE);
    }
    await db.execAsync(`PRAGMA user_version = ${migration.version};`);
  } catch (cause) {
    throw new Error(migrationFailedMessage(migration.version), { cause });
  }
}

// Apagar a tabela leva junto os índices e os triggers dela. As tabelas internas do SQLite
// (sqlite_*) ficam, e a sqlite_sequence perde sozinha a contagem de id das tabelas apagadas.
async function dropAllTables(db: MigrationDatabase): Promise<void> {
  const tables = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%';",
  );
  for (const { name } of tables) {
    await db.execAsync(`DROP TABLE "${name}";`);
  }
  await db.execAsync("PRAGMA user_version = 0;");
}

// Alguns erros, como disco cheio, já fazem o SQLite desfazer a transação sozinho. Nesse caso o
// ROLLBACK também falha, e o erro que deve chegar à tela é o original.
async function rollbackQuietly(db: MigrationDatabase): Promise<void> {
  try {
    await db.execAsync("ROLLBACK;");
  } catch {
    // Sem transação aberta, não há o que desfazer.
  }
}

async function readPragma(
  db: MigrationDatabase,
  pragma: "user_version" | "foreign_keys",
): Promise<number> {
  const row = await db.getFirstAsync<Record<string, number>>(`PRAGMA ${pragma};`);
  return row?.[pragma] ?? 0;
}

async function countForeignKeyViolations(db: MigrationDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    "SELECT COUNT(*) AS total FROM pragma_foreign_key_check;",
  );
  return row?.total ?? 0;
}
