// Migrações do banco (DADOS-1): o mesmo migrateDatabase do app, num SQLite em memória. Cobrem o
// banco novo, o banco de antes das migrações, a abertura seguinte, a falha no meio, o banco de uma
// versão mais nova do app e as chaves estrangeiras.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  asMigrationDatabase,
  createDatabase,
  dateInt,
  insertOwner,
  insertPet,
  openConnection,
} from "./helpers/database.mjs";
import {
  BROKEN_FOREIGN_KEY_MESSAGE,
  migrateDatabase,
  migrationFailedMessage,
  NEWER_DATABASE_MESSAGE,
} from "../app/config/migrator.ts";
import { MIGRATIONS } from "../app/config/schema.ts";

const LATEST = MIGRATIONS.length;

const migrate = (db, migrations = MIGRATIONS) => migrateDatabase(asMigrationDatabase(db), migrations);
const userVersion = (db) => db.prepare("PRAGMA user_version").get().user_version;
const foreignKeys = (db) => db.prepare("PRAGMA foreign_keys").get().foreign_keys;
const count = (db, table) => db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get().total;
const rows = (db, table) => db.prepare(`SELECT * FROM ${table} ORDER BY id`).all();
const schemaObjects = (db) =>
  db
    .prepare("SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name")
    .all();

/** Uma migração a mais depois das do app, só para o teste. */
const nextMigration = (statements, offset = 1) => ({ version: LATEST + offset, statements });

/** Banco como o app criava antes das migrações: o mesmo SQL da versão 1, sem marcar a versão. */
function createLegacyDatabase() {
  const db = openConnection();
  for (const sql of MIGRATIONS[0].statements) db.exec(sql);
  return db;
}

/** Um dono com um pet de pacote, que já gera a agenda automática pelo trigger. */
function insertOwnerWithPackagePet(db) {
  const dono_id = insertOwner(db);
  const pet = insertPet(db, {
    dono_id,
    remarcacao_ativa: 1,
    pacote_remarcacao: 4,
    data_inicio_pacote: dateInt(3),
    valor_pacote: "200,00",
  });
  return { dono_id, pet };
}

/** Confere a mensagem amigável e o motivo de verdade, que fica no cause. */
const failedAt = (version, causeMessage) => (error) => {
  assert.equal(error.message, migrationFailedMessage(version));
  if (causeMessage) assert.equal(error.cause.message, causeMessage);
  return true;
};

describe("migrações do banco", () => {
  test("as versões do app seguem em sequência a partir de 1", () => {
    assert.deepEqual(
      MIGRATIONS.map((migration) => migration.version),
      MIGRATIONS.map((_, index) => index + 1),
    );
  });

  test("banco novo: cria o esquema inteiro, com os dados iniciais, e marca a última versão", async () => {
    const db = openConnection();

    assert.equal(await migrate(db), LATEST);

    assert.equal(userVersion(db), LATEST);
    assert.equal(count(db, "species"), 3);
    assert.equal(count(db, "payment_methods"), 5);
    assert.equal(schemaObjects(db).filter((object) => object.type === "trigger").length, 8);
    assert.equal(foreignKeys(db), 1, "as chaves estrangeiras voltam a valer depois da migração");
  });

  test("banco de antes das migrações: ganha a versão 1 sem perder dados e com os triggers de hoje", async () => {
    const db = createLegacyDatabase();
    const { dono_id, pet } = insertOwnerWithPackagePet(db);
    // Um trigger de uma versão antiga do app, que o IF NOT EXISTS nunca atualizaria.
    db.exec(`
      DROP TRIGGER trg_owner_desativar_pets;
      CREATE TRIGGER trg_owner_desativar_pets AFTER UPDATE OF is_ativo ON owners BEGIN SELECT 1; END;
    `);
    const before = Object.fromEntries(
      ["owners", "pets", "appointments", "race"].map((table) => [table, rows(db, table)]),
    );
    assert.equal(userVersion(db), 0);

    await migrate(db);

    assert.equal(userVersion(db), LATEST);
    for (const [table, tableRows] of Object.entries(before)) {
      assert.deepEqual(rows(db, table), tableRows, `${table} continua igual`);
    }
    assert.deepEqual(schemaObjects(db), schemaObjects(await createDatabase()));
    db.prepare("UPDATE owners SET is_ativo = 0 WHERE id = ?").run(dono_id);
    assert.equal(db.prepare("SELECT is_ativo FROM pets WHERE id = ?").get(pet.id).is_ativo, 0);
  });

  test("na abertura seguinte, nenhuma migração já aplicada roda de novo", async () => {
    const db = await createDatabase();
    // Se a versão 1 rodasse de novo, este comando falharia.
    const alreadyApplied = [{ version: 1, statements: ["SELECT * FROM tabela_que_nao_existe;"] }];

    assert.equal(await migrate(db, alreadyApplied), 1);
  });

  test("só as migrações pendentes rodam, em ordem", async () => {
    const db = await createDatabase();
    const configsBefore = count(db, "configs");
    const migrations = [
      ...MIGRATIONS,
      nextMigration(["INSERT INTO configs (config) VALUES ('Teste');"], 1),
      nextMigration(["UPDATE configs SET is_ativo = 1 WHERE config = 'Teste';"], 2),
    ];

    assert.equal(await migrate(db, migrations), LATEST + 2);
    assert.equal(await migrate(db, migrations), LATEST + 2);

    assert.equal(count(db, "configs"), configsBefore + 1);
    assert.equal(db.prepare("SELECT is_ativo FROM configs WHERE config = 'Teste'").get().is_ativo, 1);
  });

  test("uma migração que falha desfaz todas as pendentes e mantém a versão", async () => {
    const db = openConnection();
    const migrations = [
      ...MIGRATIONS,
      nextMigration(["CREATE TABLE extra (id INTEGER);", "INSERT INTO tabela_que_nao_existe VALUES (1);"]),
    ];

    await assert.rejects(migrate(db, migrations), failedAt(LATEST + 1));

    assert.equal(userVersion(db), 0);
    assert.deepEqual(schemaObjects(db), [], "nem as tabelas da versão 1 ficam");
    assert.equal(foreignKeys(db), 1);
  });

  test("banco de uma versão mais nova do app: recusa e não mexe em nada", async () => {
    const db = await createDatabase();
    db.exec(`PRAGMA user_version = ${LATEST + 5};`);
    const schemaBefore = schemaObjects(db);

    await assert.rejects(migrate(db), { message: NEWER_DATABASE_MESSAGE });

    assert.equal(userVersion(db), LATEST + 5);
    assert.deepEqual(schemaObjects(db), schemaBefore);
  });

  test("reconstruir uma tabela não apaga as filhas pelo ON DELETE CASCADE", async () => {
    const db = await createDatabase();
    const migrations = [
      ...MIGRATIONS,
      nextMigration([
        `CREATE TABLE parent (id INTEGER PRIMARY KEY);
         CREATE TABLE child (id INTEGER PRIMARY KEY, parent_id INTEGER REFERENCES parent(id) ON DELETE CASCADE);
         INSERT INTO parent (id) VALUES (1), (2);
         INSERT INTO child (parent_id) VALUES (1), (2), (2);`,
      ]),
      // Os passos que o SQLite indica para mudar uma coluna: criar a tabela nova, copiar e trocar.
      nextMigration(
        [
          `CREATE TABLE parent_new (id INTEGER PRIMARY KEY, nome TEXT NOT NULL DEFAULT '');
           INSERT INTO parent_new (id) SELECT id FROM parent;
           DROP TABLE parent;
           ALTER TABLE parent_new RENAME TO parent;`,
        ],
        2,
      ),
    ];

    await migrate(db, migrations);

    assert.equal(count(db, "child"), 3);
    assert.equal(count(db, "parent"), 2);
    assert.equal(foreignKeys(db), 1);
  });

  test("uma migração que deixa registro apontando para outro que não existe é recusada", async () => {
    const db = await createDatabase();
    insertOwnerWithPackagePet(db);
    // Com as chaves estrangeiras desligadas, apagar o dono não leva os pets junto.
    const migrations = [...MIGRATIONS, nextMigration(["DELETE FROM owners;"])];

    await assert.rejects(migrate(db, migrations), failedAt(LATEST + 1, BROKEN_FOREIGN_KEY_MESSAGE));

    assert.equal(count(db, "owners"), 1);
    assert.equal(userVersion(db), LATEST);
  });

  test("um banco que já tinha registro com referência quebrada continua abrindo", async () => {
    const db = createLegacyDatabase();
    db.exec("PRAGMA foreign_keys = OFF;");
    insertPet(db, { dono_id: 999 });
    db.exec("PRAGMA foreign_keys = ON;");

    assert.equal(await migrate(db), LATEST);
  });

  test("uma lista fora de sequência é recusada antes de mexer no banco", async () => {
    const db = openConnection();

    await assert.rejects(migrate(db, [{ version: 2, statements: [] }]), /fora de ordem/);

    assert.equal(userVersion(db), 0);
    assert.deepEqual(schemaObjects(db), []);
  });
});
