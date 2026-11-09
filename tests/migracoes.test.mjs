// Migrações do banco (DADOS-1): o mesmo migrateDatabase do app, num SQLite em memória. Cobrem o
// banco novo, o banco de antes das migrações, a abertura seguinte, a falha no meio, o banco de uma
// versão mais nova do app e as chaves estrangeiras. No fim, o recreateDatabase, que o reset de
// desenvolvimento usa para apagar tudo antes de carregar os dados de exemplo.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  asMigrationDatabase,
  createDatabase,
  createLegacyDatabase,
  databaseAt,
  insertOwner,
  insertPet,
  isoDate,
  legacyDateInt,
  openConnection,
  toDate,
} from "./helpers/database.mjs";
import {
  migrateDatabase,
  recreateDatabase,
} from "../app/config/migrator.ts";
import { MESSAGES } from "../app/globals/messages.ts";
import { AppError } from "../app/errors/AppError.ts";
import { MIGRATIONS } from "../app/config/schema.ts";
import { buildDemoDataSql, DEMO_DATA_SUMMARY } from "../app/config/demoData.ts";
import { normalizeForSearch } from "../app/utils/formatadores/normalizaNome.ts";

const LATEST = MIGRATIONS.length;

const migrate = (db, migrations = MIGRATIONS) => migrateDatabase(asMigrationDatabase(db), migrations);
const recreate = (db, migrations = MIGRATIONS) => recreateDatabase(asMigrationDatabase(db), migrations);
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

// O pacote no formato de cada época: até a versão 2, data AAAAMMDD e valor em texto com vírgula.
const PACKAGE = { data_inicio_pacote: isoDate(3), valor_pacote: 20000 };
const LEGACY_PACKAGE = { data_inicio_pacote: legacyDateInt(3), valor_pacote: "200,00" };

/** Um dono com um pet de pacote, que já gera a agenda automática pelo trigger. */
function insertOwnerWithPackagePet(db, pkg = PACKAGE) {
  const dono_id = insertOwner(db);
  const pet = insertPet(db, { dono_id, remarcacao_ativa: 1, pacote_remarcacao: 4, ...pkg });
  return { dono_id, pet };
}

/** 20261108 → "2026-11-08" */
const isoFromLegacy = (value) => String(value).replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");

/** Confere a mensagem amigável e o motivo de verdade, que fica no cause. */
const failedAt = (version, causeMessage) => (error) => {
  assert.ok(error instanceof AppError);
  assert.equal(error.code, "DATABASE");
  assert.equal(error.message, MESSAGES.database.migrationFailed(version));
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
    const { dono_id, pet } = insertOwnerWithPackagePet(db, LEGACY_PACKAGE);
    // Um trigger de uma versão antiga do app, que o IF NOT EXISTS nunca atualizaria.
    db.exec(`
      DROP TRIGGER trg_owner_desativar_pets;
      CREATE TRIGGER trg_owner_desativar_pets AFTER UPDATE OF is_ativo ON owners BEGIN SELECT 1; END;
    `);
    const before = Object.fromEntries(
      ["owners", "pets", "appointments", "race"].map((table) => [table, rows(db, table)]),
    );
    assert.equal(userVersion(db), 0);

    await migrate(db, MIGRATIONS.slice(0, 1));

    assert.equal(userVersion(db), 1);
    for (const [table, tableRows] of Object.entries(before)) {
      assert.deepEqual(rows(db, table), tableRows, `${table} continua igual`);
    }
    assert.deepEqual(schemaObjects(db), schemaObjects(await databaseAt(1)));
    db.prepare("UPDATE owners SET is_ativo = 0 WHERE id = ?").run(dono_id);
    assert.equal(db.prepare("SELECT is_ativo FROM pets WHERE id = ?").get(pet.id).is_ativo, 0);
  });

  test("na abertura seguinte, nenhuma migração já aplicada roda de novo", async () => {
    const db = await createDatabase();
    // Se alguma versão rodasse de novo, este comando falharia.
    const alreadyApplied = MIGRATIONS.map(({ version }) => ({
      version,
      statements: ["SELECT * FROM tabela_que_nao_existe;"],
    }));

    assert.equal(await migrate(db, alreadyApplied), LATEST);
  });

  test("banco na versão 1: sobe para a 2 sem perder dados e com os triggers corrigidos", async () => {
    const db = await databaseAt(1);
    const { pet } = insertOwnerWithPackagePet(db, LEGACY_PACKAGE);
    const before = Object.fromEntries(
      ["owners", "pets", "appointments"].map((table) => [table, rows(db, table)]),
    );

    await migrate(db, MIGRATIONS.slice(0, 2));

    assert.equal(userVersion(db), 2);
    for (const [table, tableRows] of Object.entries(before)) {
      assert.deepEqual(rows(db, table), tableRows, `${table} continua igual`);
    }
    assert.deepEqual(schemaObjects(db), schemaObjects(await databaseAt(2)));
    // Com o trigger da versão 2, editar só a observação não mexe mais na agenda (BUG-4).
    db.prepare("UPDATE pets SET observacoes = 'Teste' WHERE id = ?").run(pet.id);
    assert.deepEqual(rows(db, "appointments"), before.appointments);
  });

  test("banco na versão 2: sobe para a 3 com o dinheiro em centavos e as datas em texto", async () => {
    const db = await databaseAt(2);
    const { pet } = insertOwnerWithPackagePet(db, LEGACY_PACKAGE);
    const semPacote = insertPet(db, { dono_id: pet.dono_id, nome: "Sem pacote", valor_pacote: null });
    // Valores como as máscaras antigas deixavam gravar, com o que cada um vale em centavos.
    const legacyValues = [
      ["12,5", 1250], ["12,", 1200], ["", 0], ["7", 700], ["0,99", 99],
      ["1234,56", 123456], ["12,505", 1250], ["12.5", 1250],
    ];
    const insertLegacy = db.prepare(
      "INSERT INTO appointments (pet_id, servico, data, valor, concluido) VALUES (?, 'Banho', ?, ?, 1)",
    );
    for (const [valor] of legacyValues) insertLegacy.run(semPacote.id, legacyDateInt(-10), valor);
    db.prepare("UPDATE pets SET current_ultima_visita_data = ? WHERE id = ?").run(legacyDateInt(-10), semPacote.id);
    // O último agendamento apagado: o id dele não pode voltar depois da troca das tabelas.
    const deletedId = rows(db, "appointments").at(-1).id;
    db.prepare("DELETE FROM appointments WHERE id = ?").run(deletedId);
    const before = Object.fromEntries(
      ["owners", "pets", "appointments"].map((table) => [table, rows(db, table)]),
    );

    await migrate(db);

    assert.equal(userVersion(db), 3);
    assert.deepEqual(schemaObjects(db), schemaObjects(await createDatabase()));

    const centsByText = new Map(legacyValues);
    const appointments = rows(db, "appointments");
    assert.equal(appointments.length, before.appointments.length);
    appointments.forEach((after, index) => {
      const old = before.appointments[index];
      assert.deepEqual(
        { ...after, data: old.data, valor: old.valor, criado_em: old.criado_em, dia_semana: old.dia_semana },
        { ...old },
        "as outras colunas não mudam",
      );
      assert.equal(after.data, isoFromLegacy(old.data));
      assert.equal(after.criado_em, isoFromLegacy(old.criado_em));
      assert.equal(after.dia_semana, toDate(after.data).getDay());
      const expected = centsByText.get(old.valor) ?? Number(old.valor.replace(",", ""));
      assert.equal(after.valor, expected, `"${old.valor}" vira ${expected} centavos`);
    });

    const [withPackage, withoutPackage] = rows(db, "pets");
    assert.equal(withPackage.valor_pacote, 20000);
    assert.equal(withPackage.data_inicio_pacote, isoDate(3));
    assert.equal(withPackage.ultimo_visita_data_auto, isoFromLegacy(before.pets[0].ultimo_visita_data_auto));
    assert.equal(withoutPackage.valor_pacote, null);
    assert.equal(withoutPackage.current_ultima_visita_data, isoDate(-10));
    assert.equal(rows(db, "owners")[0].criado_em, isoFromLegacy(before.owners[0].criado_em));

    const nextId = Number(
      db.prepare("INSERT INTO appointments (pet_id, servico, data) VALUES (?, 'Banho', ?)").run(pet.id, isoDate(5))
        .lastInsertRowid,
    );
    assert.equal(nextId, deletedId + 1, "a contagem de ids continua de onde parou");
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

    await assert.rejects(migrate(db), { name: "AppError", code: "DATABASE", message: MESSAGES.database.newerVersion });

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

    await assert.rejects(migrate(db, migrations), failedAt(LATEST + 1, MESSAGES.database.brokenForeignKey));

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

describe("recriar o banco (reset de desenvolvimento)", () => {
  test("apaga os dados e deixa o banco igual ao de uma instalação nova", async () => {
    const db = await createDatabase();
    insertOwnerWithPackagePet(db);
    db.exec("UPDATE configs SET is_ativo = 1 WHERE id = 1;");
    db.exec("CREATE TABLE sobra_de_teste (id INTEGER PRIMARY KEY);");

    assert.equal(await recreate(db), LATEST);

    assert.equal(userVersion(db), LATEST);
    for (const table of ["owners", "pets", "appointments"]) {
      assert.equal(count(db, table), 0, `${table} fica vazia`);
    }
    assert.deepEqual(schemaObjects(db), schemaObjects(await createDatabase()));
    assert.equal(db.prepare("SELECT is_ativo FROM configs WHERE id = 1").get().is_ativo, 0);
    assert.equal(insertOwner(db), 1, "os ids recomeçam do 1");
    assert.equal(foreignKeys(db), 1);
  });

  test("depois de recriar, os dados de exemplo carregam como no app vazio", async () => {
    const db = await createDatabase();
    insertOwnerWithPackagePet(db);

    await recreate(db);
    db.exec(buildDemoDataSql({ today: new Date(), normalize: normalizeForSearch }));

    assert.equal(count(db, "owners"), DEMO_DATA_SUMMARY.owners);
    assert.equal(count(db, "pets"), DEMO_DATA_SUMMARY.pets);
  });

  test("se uma migração falhar, os dados antigos continuam lá", async () => {
    const db = await createDatabase();
    insertOwnerWithPackagePet(db);
    const migrations = [...MIGRATIONS, nextMigration(["INSERT INTO tabela_que_nao_existe VALUES (1);"])];

    await assert.rejects(recreate(db, migrations), failedAt(LATEST + 1));

    assert.equal(count(db, "owners"), 1);
    assert.equal(count(db, "pets"), 1);
    assert.equal(userVersion(db), LATEST);
    assert.equal(foreignKeys(db), 1);
  });
});
