import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('petshop.db');
    await db.execAsync(`PRAGMA journal_mode = WAL;`);
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS owners (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nome      TEXT    NOT NULL,
      telefone  TEXT    NOT NULL,
      email     TEXT,
      endereco  TEXT,
      criado_em TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pets (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nome        TEXT    NOT NULL,
      especie     TEXT    NOT NULL,
      raca        TEXT,
      observacoes TEXT,
      owner_id    INTEGER NOT NULL,
      criado_em   TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id       INTEGER NOT NULL,
      servico      TEXT    NOT NULL,
      data         TEXT    NOT NULL,
      hora         TEXT    NOT NULL,
      entregar_pet INTEGER NOT NULL DEFAULT 0, -- 0 = não, 1 = sim
      observacao   TEXT,
      criado_em    TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
    );
  `);
}