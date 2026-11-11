// Migrações do banco (DADOS-1): o mesmo migrateDatabase do app, num SQLite em memória. Cobrem o
// banco novo, o banco de antes das migrações, a abertura seguinte, a falha no meio, o banco de uma
// versão mais nova do app e as chaves estrangeiras. No fim, o recreateDatabase, que o reset de
// desenvolvimento usa para apagar tudo antes de carregar os dados de exemplo.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  appointmentsOf,
  asMigrationDatabase,
  createDatabase,
  createLegacyDatabase,
  databaseAt,
  insertOwner,
  insertPet,
  isoDate,
  legacyDateInt,
  openConnection,
  packageScheduleOf,
  pendingAutoOf,
  petRow,
  tableRows,
  toDate,
} from "./helpers/database.mjs";
import { migrateDatabase, recreateDatabase } from "../src/config/migrator.ts";
import { MESSAGES } from "../src/globals/messages.ts";
import { AppError } from "../src/errors/AppError.ts";
import { MIGRATIONS } from "../src/config/schema.ts";
import { buildDemoDataSql, DEMO_DATA_SUMMARY } from "../src/config/demoData.ts";
import { normalizeForSearch } from "../src/utils/formatters/normalizeForSearch.ts";

const LATEST = MIGRATIONS.length;

const migrate = (db, migrations = MIGRATIONS) =>
  migrateDatabase(asMigrationDatabase(db), migrations);
const recreate = (db, migrations = MIGRATIONS) =>
  recreateDatabase(asMigrationDatabase(db), migrations);
const userVersion = (db) => db.prepare("PRAGMA user_version").get().user_version;
const foreignKeys = (db) => db.prepare("PRAGMA foreign_keys").get().foreign_keys;
const count = (db, table) => db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get().total;
const rows = tableRows;
const schemaObjects = (db) =>
  db
    .prepare(
      "SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name",
    )
    .all();
const triggerNames = (db) =>
  schemaObjects(db)
    .filter(({ type }) => type === "trigger")
    .map(({ name }) => name);

/** Os triggers da remarcação, que a versão 4 tira (ARQ-2). */
const SCHEDULE_TRIGGERS = [
  "trg_pet_remarcacao_ativar",
  "trg_pet_remarcacao_insert",
  "trg_remarcacao_automatica",
];

/** Uma migração a mais depois das do app, só para o teste. */
const nextMigration = (statements, offset = 1) => ({ version: LATEST + offset, statements });

// O pacote no formato de cada época: até a versão 2, data AAAAMMDD e valor em texto com vírgula.
const PACKAGE = { package_start_date: isoDate(3), package_price: 20000 };
const LEGACY_PACKAGE = { package_start_date: legacyDateInt(3), package_price: "200,00" };

/** Um dono com um pet de pacote. Nas versões 1 a 3, o trigger da época gera a agenda dele. */
function insertOwnerWithPackagePet(db, pkg = PACKAGE) {
  const owner_id = insertOwner(db);
  const pet = insertPet(db, { owner_id, reschedule_active: 1, package_frequency: 4, ...pkg });
  return { owner_id, pet };
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
    // Desde a versão 4, só os de integridade e cascata; a agenda do pacote é do PackageScheduleService.
    assert.deepEqual(triggerNames(db), [
      "trg_last_visit",
      "trg_owner_deactivate_pets",
      "trg_pet_activate_owner",
      "trg_pet_deactivate_clear_package",
      "trg_pet_reschedule_off",
    ]);
    assert.equal(foreignKeys(db), 1, "as chaves estrangeiras voltam a valer depois da migração");
  });

  test("banco de antes das migrações: ganha a versão 1 sem perder dados e com os triggers de hoje", async () => {
    const db = createLegacyDatabase();
    const { owner_id, pet } = insertOwnerWithPackagePet(db, LEGACY_PACKAGE);
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
    db.prepare("UPDATE owners SET is_ativo = 0 WHERE id = ?").run(owner_id);
    assert.equal(petRow(db, pet.id).is_active, 0);
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
    const noPackagePet = insertPet(db, {
      owner_id: pet.owner_id,
      name: "Sem pacote",
      package_price: null,
    });
    // Valores como as máscaras antigas deixavam gravar, com o que cada um vale em centavos.
    const legacyValues = [
      ["12,5", 1250],
      ["12,", 1200],
      ["", 0],
      ["7", 700],
      ["0,99", 99],
      ["1234,56", 123456],
      ["12,505", 1250],
      ["12.5", 1250],
    ];
    const insertLegacy = db.prepare(
      "INSERT INTO appointments (pet_id, servico, data, valor, concluido) VALUES (?, 'Banho', ?, ?, 1)",
    );
    for (const [price] of legacyValues)
      insertLegacy.run(noPackagePet.id, legacyDateInt(-10), price);
    db.prepare("UPDATE pets SET current_ultima_visita_data = ? WHERE id = ?").run(
      legacyDateInt(-10),
      noPackagePet.id,
    );
    // O último agendamento apagado: o id dele não pode voltar depois da troca das tabelas.
    const deletedId = rows(db, "appointments").at(-1).id;
    db.prepare("DELETE FROM appointments WHERE id = ?").run(deletedId);
    const before = Object.fromEntries(
      ["owners", "pets", "appointments"].map((table) => [table, rows(db, table)]),
    );

    await migrate(db, MIGRATIONS.slice(0, 3));

    assert.equal(userVersion(db), 3);
    assert.deepEqual(schemaObjects(db), schemaObjects(await databaseAt(3)));

    const centsByText = new Map(legacyValues);
    const appointments = rows(db, "appointments");
    assert.equal(appointments.length, before.appointments.length);
    appointments.forEach((after, index) => {
      const old = before.appointments[index];
      assert.deepEqual(
        {
          ...after,
          date: old.date,
          price: old.price,
          created_at: old.created_at,
          weekday: old.weekday,
        },
        { ...old },
        "as outras colunas não mudam",
      );
      assert.equal(after.date, isoFromLegacy(old.date));
      assert.equal(after.created_at, isoFromLegacy(old.created_at));
      assert.equal(after.weekday, toDate(after.date).getDay());
      const expected = centsByText.get(old.price) ?? Number(old.price.replace(",", ""));
      assert.equal(after.price, expected, `"${old.price}" vira ${expected} centavos`);
    });

    const [withPackage, withoutPackage] = rows(db, "pets");
    assert.equal(withPackage.package_price, 20000);
    assert.equal(withPackage.package_start_date, isoDate(3));
    assert.equal(
      withPackage.last_auto_visit_date,
      isoFromLegacy(before.pets[0].last_auto_visit_date),
    );
    assert.equal(withoutPackage.package_price, null);
    assert.equal(withoutPackage.last_visit_date, isoDate(-10));
    assert.equal(rows(db, "owners")[0].created_at, isoFromLegacy(before.owners[0].created_at));

    const nextId = Number(
      db
        .prepare("INSERT INTO appointments (pet_id, servico, data) VALUES (?, 'Banho', ?)")
        .run(pet.id, isoDate(5)).lastInsertRowid,
    );
    assert.equal(nextId, deletedId + 1, "a contagem de ids continua de onde parou");
  });

  test("banco na versão 3: sobe para a 4 sem perder dados e sem os triggers da remarcação", async () => {
    const db = await databaseAt(3);
    const { pet } = insertOwnerWithPackagePet(db);
    const before = Object.fromEntries(
      ["owners", "pets", "appointments"].map((table) => [table, rows(db, table)]),
    );
    const v3Objects = schemaObjects(db);
    assert.ok(pendingAutoOf(db, pet.id).length > 0, "o trigger da versão 3 gerou a agenda");

    await migrate(db, MIGRATIONS.slice(0, 4));

    assert.equal(userVersion(db), 4);
    for (const [table, tableRows] of Object.entries(before)) {
      assert.deepEqual(rows(db, table), tableRows, `${table} continua igual`);
    }
    assert.deepEqual(schemaObjects(db), schemaObjects(await databaseAt(4)));
    assert.deepEqual(
      schemaObjects(db),
      v3Objects.filter(({ name }) => !SCHEDULE_TRIGGERS.includes(name)),
      "só saem os três triggers da remarcação",
    );
  });

  test("a agenda que veio da versão 3 continua pela remarcação em TypeScript", async () => {
    const db = await databaseAt(3);
    const { pet } = insertOwnerWithPackagePet(db);
    await migrate(db);
    const [first] = pendingAutoOf(db, pet.id);
    const lastBefore = petRow(db, pet.id).last_auto_visit_date;
    const countBefore = appointmentsOf(db, pet.id).length;

    await packageScheduleOf(db).updateAppointment(first.id, { ...first, completed: 1 });

    const agenda = appointmentsOf(db, pet.id);
    assert.equal(agenda.length, countBefore + 1, "concluir cria o próximo");
    assert.ok(agenda.at(-1).date > lastBefore);
    assert.equal(petRow(db, pet.id).last_auto_visit_date, agenda.at(-1).date);
    assert.equal(
      petRow(db, pet.id).last_visit_date,
      first.date,
      "a última visita segue no trigger",
    );
  });

  test("banco na versão 4: o horário padrão nulo vira 00:00, e o resto do pet fica igual", async () => {
    const db = await databaseAt(4);
    const { pet } = insertOwnerWithPackagePet(db);
    const withTime = insertPet(db, {
      owner_id: pet.owner_id,
      name: "Com horário",
      default_time: "14:30",
    });
    db.prepare("UPDATE pets SET horario_padrao = NULL WHERE id = ?").run(pet.id);
    const before = rows(db, "pets");

    await migrate(db, MIGRATIONS.slice(0, 5));

    assert.equal(userVersion(db), 5);
    assert.equal(petRow(db, pet.id).default_time, "00:00");
    assert.equal(petRow(db, withTime.id).default_time, "14:30", "o horário preenchido não muda");
    const withoutTime = ({ default_time, ...rest }) => rest;
    assert.deepEqual(rows(db, "pets").map(withoutTime), before.map(withoutTime));
  });

  // Antes da versão 5, o nulo quebrava a conclusão (PR #49). A remarcação de hoje grava no formato da
  // versão 6, então o banco antigo é montado à mão: o pet sem horário e um automático pendente.
  test("o pet antigo sem horário volta a concluir o automático", async () => {
    const db = await databaseAt(4);
    const { pet } = insertOwnerWithPackagePet(db);
    db.prepare("UPDATE pets SET horario_padrao = NULL WHERE id = ?").run(pet.id);
    db.prepare(
      "INSERT INTO appointments (pet_id, servico, data, hora, is_auto_agen) VALUES (?, 'Banho', ?, '10:00', 1)",
    ).run(pet.id, isoDate(1));

    await migrate(db);
    const [first] = pendingAutoOf(db, pet.id);
    await packageScheduleOf(db).updateAppointment(first.id, { ...first, completed: 1 });

    assert.equal(
      pendingAutoOf(db, pet.id).at(-1).time,
      "00:00",
      "o próximo da agenda leva o 00:00",
    );
  });

  test("banco de antes das migrações sobe direto para a última versão, sem os triggers da remarcação", async () => {
    const db = createLegacyDatabase();
    const { pet } = insertOwnerWithPackagePet(db, LEGACY_PACKAGE);
    const appointmentsBefore = rows(db, "appointments").length;

    assert.equal(await migrate(db), LATEST);

    assert.deepEqual(schemaObjects(db), schemaObjects(await createDatabase()));
    assert.equal(rows(db, "appointments").length, appointmentsBefore, "a agenda gravada fica");
    assert.equal(petRow(db, pet.id).package_start_date, isoDate(3));
  });

  test("só as migrações pendentes rodam, em ordem", async () => {
    const db = await createDatabase();
    const settingsBefore = count(db, "settings");
    const migrations = [
      ...MIGRATIONS,
      nextMigration(["INSERT INTO settings (key, value) VALUES ('teste', '1');"], 1),
      nextMigration(["UPDATE settings SET value = '2' WHERE key = 'teste';"], 2),
    ];

    assert.equal(await migrate(db, migrations), LATEST + 2);
    assert.equal(await migrate(db, migrations), LATEST + 2);

    assert.equal(count(db, "settings"), settingsBefore + 1);
    assert.equal(db.prepare("SELECT value FROM settings WHERE key = 'teste'").get().value, "2");
  });

  test("uma migração que falha desfaz todas as pendentes e mantém a versão", async () => {
    const db = openConnection();
    const migrations = [
      ...MIGRATIONS,
      nextMigration([
        "CREATE TABLE extra (id INTEGER);",
        "INSERT INTO tabela_que_nao_existe VALUES (1);",
      ]),
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

    await assert.rejects(migrate(db), {
      name: "AppError",
      code: "DATABASE",
      message: MESSAGES.database.newerVersion,
    });

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
          `CREATE TABLE parent_new (id INTEGER PRIMARY KEY, name TEXT NOT NULL DEFAULT '');
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

    await assert.rejects(
      migrate(db, migrations),
      failedAt(LATEST + 1, MESSAGES.database.brokenForeignKey),
    );

    assert.equal(count(db, "owners"), 1);
    assert.equal(userVersion(db), LATEST);
  });

  test("um banco que já tinha registro com referência quebrada continua abrindo", async () => {
    const db = createLegacyDatabase();
    db.exec("PRAGMA foreign_keys = OFF;");
    insertPet(db, { owner_id: 999 });
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

describe("migração para a versão 7 (nomes em inglês)", () => {
  test("tabelas, colunas e códigos em inglês, com os mesmos dados, ids e contagem de ids", async () => {
    const db = await databaseAt(6);
    const ownerId = insertOwner(db, { name: "Dona da versão 6" });
    const pet = insertPet(db, {
      owner_id: ownerId,
      name: "Pipoca",
      species_id: 2,
      size: "EXTRA_LARGE",
    });
    db.prepare("DELETE FROM owners WHERE id = ?").run(insertOwner(db, { name: "Apagado" }));
    db.prepare("UPDATE configs SET is_ativo = 1 WHERE config = 'Modo Escuro'").run();
    const before = Object.fromEntries(["owners", "pets"].map((table) => [table, rows(db, table)]));
    const sequencesBefore = db
      .prepare("SELECT name, seq FROM sqlite_sequence WHERE name IN ('owners', 'pets')")
      .all();

    await migrate(db);

    assert.deepEqual(schemaObjects(db), schemaObjects(await createDatabase()));
    assert.deepEqual(rows(db, "owners"), before.owners);
    assert.deepEqual(
      rows(db, "pets").map(({ size, ...rest }) => rest),
      before.pets.map(({ size, ...rest }) => rest),
    );
    assert.equal(petRow(db, pet.id).size, "EXTRA_LARGE", "GRANDAO vira EXTRA_LARGE");
    assert.deepEqual(
      db
        .prepare("SELECT name FROM species ORDER BY id")
        .all()
        .map(({ name }) => name),
      ["DOG", "CAT", "OTHER"],
    );
    assert.deepEqual(
      db.prepare("SELECT name, seq FROM sqlite_sequence WHERE name IN ('owners', 'pets')").all(),
      sequencesBefore,
    );
    assert.equal(db.prepare("SELECT value FROM settings WHERE key = 'theme'").get().value, "dark");
  });

  test("o tema escuro desligado não vira escolha: o app segue o sistema", async () => {
    const db = await databaseAt(6);
    await migrate(db);
    assert.equal(count(db, "settings"), 0);
  });
});

describe("recriar o banco (reset de desenvolvimento)", () => {
  test("apaga os dados e deixa o banco igual ao de uma instalação nova", async () => {
    const db = await createDatabase();
    insertOwnerWithPackagePet(db);
    db.exec("INSERT INTO settings (key, value) VALUES ('theme', 'dark');");
    db.exec("CREATE TABLE sobra_de_teste (id INTEGER PRIMARY KEY);");

    assert.equal(await recreate(db), LATEST);

    assert.equal(userVersion(db), LATEST);
    for (const table of ["owners", "pets", "appointments"]) {
      assert.equal(count(db, table), 0, `${table} fica vazia`);
    }
    assert.deepEqual(schemaObjects(db), schemaObjects(await createDatabase()));
    assert.equal(count(db, "settings"), 0, "o tema volta a seguir o sistema");
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
    const migrations = [
      ...MIGRATIONS,
      nextMigration(["INSERT INTO tabela_que_nao_existe VALUES (1);"]),
    ];

    await assert.rejects(recreate(db, migrations), failedAt(LATEST + 1));

    assert.equal(count(db, "owners"), 1);
    assert.equal(count(db, "pets"), 1);
    assert.equal(userVersion(db), LATEST);
    assert.equal(foreignKeys(db), 1);
  });
});
