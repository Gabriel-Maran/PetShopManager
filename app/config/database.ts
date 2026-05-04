import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync("petshop.db");
    await db.execAsync(`PRAGMA journal_mode = WAL;`);
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const db = await getDatabase();
  /*
-- CUIDADO: Isso apaga tudo toda vez que o app inicia!
-- Apenas deixando aqui, caso algo mude no db, ficar mais facil de resetar o banco durante o desenvolvimento. 
-- Em produção, isso deve ser removido (cinza = comentado).
-- Para funcionar, precisa estar dentro acima do primeiro CREATE TABLE
    DROP TABLE IF EXISTS appointments;
    DROP TABLE IF EXISTS pets;
    DROP TABLE IF EXISTS owners;
*/
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS owners (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nome      TEXT    NOT NULL,
      telefone  TEXT    NOT NULL,
      email     TEXT,
      endereco  TEXT,
      criado_em INTEGER NOT NULL DEFAULT (strftime('%Y%m%d', 'now'))
    );

    CREATE TABLE IF NOT EXISTS pets (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      nome              TEXT    NOT NULL,
      especie           TEXT    NOT NULL,
      raca              TEXT,
      observacoes       TEXT,
      dono_id           INTEGER NOT NULL,
      ultimo_banho_data TEXT,
      criado_em         INTEGER NOT NULL DEFAULT (strftime('%Y%m%d', 'now')),
      FOREIGN KEY (dono_id) REFERENCES owners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id       INTEGER NOT NULL,
      servico      TEXT    NOT NULL,
      data         INTEGER NOT NULL,
      hora         TEXT    NOT NULL,
      entregar_pet INTEGER NOT NULL DEFAULT 0, -- 0 = não, 1 = sim
      observacao   TEXT,
      criado_em    INTEGER NOT NULL DEFAULT (strftime('%Y%m%d', 'now')),
      FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
    );

    -- Atualiza ultimo_banho_data do pet sempre que um agendamento de banho for inserido.
    -- Serviços considerados: 'Banho' e 'Banho e Tosa'.
    CREATE TRIGGER IF NOT EXISTS trg_ultimo_banho
    AFTER INSERT ON appointments
    FOR EACH ROW
    WHEN NEW.servico IN ('Banho', 'Banho e Tosa')
    BEGIN
      UPDATE pets
      SET ultimo_banho_data = NEW.data
      WHERE id = NEW.pet_id;
    END;
  `);
}
