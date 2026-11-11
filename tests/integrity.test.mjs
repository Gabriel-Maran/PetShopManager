// Integridade no próprio banco (DADOS-4, versão 6 do esquema): os CHECKs dos flags, do porte e dos
// horários, o dinheiro sem valor negativo, o serviço e a forma de pagamento pelo id (com chave estrangeira e
// com o nome da época no agendamento), os itens ocultos das listas e a migração de um banco da versão 5 com
// dado antigo fora do domínio, que precisa subir sem perder nenhum registro e anotando o que perde.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  asMigrationDatabase,
  createDatabase,
  createPet,
  databaseAt,
  appointmentsOf,
  editAppointmentLikeTheApp,
  editPetLikeTheApp,
  insertAppointment,
  insertOwner,
  insertPet,
  isoDate,
  packageScheduleOf,
  pendingAutoOf,
  petRow,
  tableRows,
  savePet,
} from "./helpers/database.mjs";
import { migrateDatabase } from "../src/config/migrator.ts";
import { MIGRATIONS } from "../src/config/schema.ts";
import { PetSize, ServiceName } from "../src/config/petEnums.ts";
import {
  FIND_APPOINTMENT_SQL,
  LIST_APPOINTMENTS_BETWEEN_SQL,
  UPDATE_APPOINTMENT_SQL,
  updateAppointmentParams,
} from "../src/repository/sql/appointmentsSql.ts";
import { FIND_PET_SQL } from "../src/repository/sql/petsSql.ts";
import { LIST_PAYMENT_METHODS_SQL, LIST_SERVICE_TYPES_SQL } from "../src/repository/sql/listsSql.ts";
import { assertAppointmentChoices, storedChoicesOf } from "../src/service/appointmentRules.ts";
import { appointmentSchema, appointmentSchemaFor } from "../src/validation/appointmentSchema.ts";
import { parseInput } from "../src/validation/parseInput.ts";
import { MAX_LIST_ITEM_LENGTH, MAX_NOTES_LENGTH, MAX_STORED_TEXT_LENGTH } from "../src/globals/limits.ts";
import { time } from "../src/validation/fields.ts";
import { MESSAGES } from "../src/globals/messages.ts";

const CHECK_FAILED = /CHECK constraint failed/;
const FOREIGN_KEY_FAILED = /FOREIGN KEY constraint failed/;

const schemaObjects = (db) =>
  db
    .prepare("SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name")
    .all();
const rows = (db, table) => tableRows(db, table).map((row) => ({ ...row }));
const idOf = (db, table, column, value) =>
  db.prepare(`SELECT id FROM ${table} WHERE ${column} = ?`).get(value)?.id;

const saveAppointment = (db, id, fields) => {
  const current = db.prepare(FIND_APPOINTMENT_SQL).get(id);
  db.prepare(UPDATE_APPOINTMENT_SQL).run(...updateAppointmentParams({ ...current, ...fields }, id));
};
const storedNames = (db, id) =>
  ({ ...db.prepare("SELECT service_id, service_name, payment_method_id, payment_method_name FROM appointments WHERE id = ?").get(id) });

/** Um banco novo com um dono, um pet e um agendamento, para tentar gravar valores fora do domínio. */
async function databaseWithAppointment() {
  const db = await createDatabase();
  const ownerId = insertOwner(db);
  const pet = await createPet(db, { owner_id: ownerId });
  const appointmentId = insertAppointment(db, pet.id);
  return { db, ownerId, petId: pet.id, appointmentId };
}

describe("o banco recusa valores fora do domínio", () => {
  const FLAGS = [
    ["services", "is_active"],
    ["payment_methods", "is_active"],
    ["owners", "is_active"],
    ["pets", "reschedule_active"],
    ["pets", "is_active"],
    ["appointments", "deliver_pet"],
    ["appointments", "completed"],
    ["appointments", "is_auto"],
    ["appointments", "is_paid"],
  ];

  for (const [table, column] of FLAGS) {
    test(`${table}.${column} só aceita 0 ou 1`, async () => {
      const { db } = await databaseWithAppointment();
      for (const invalid of [2, -1, "sim", 0.5, null]) {
        assert.throws(
          () => db.prepare(`UPDATE ${table} SET ${column} = ? WHERE id = 1`).run(invalid),
          invalid === null ? /NOT NULL constraint failed/ : CHECK_FAILED,
          `${column} = ${invalid}`,
        );
      }
      for (const valid of [0, 1]) {
        db.prepare(`UPDATE ${table} SET ${column} = ? WHERE id = 1`).run(valid);
      }
    });
  }

  test("o porte só aceita os quatro do app, pela chave e não pelo rótulo", async () => {
    const { db, petId } = await databaseWithAppointment();
    const setPorte = (size) => db.prepare("UPDATE pets SET size = ? WHERE id = ?").run(size, petId);

    for (const size of Object.values(PetSize)) setPorte(size);
    for (const invalid of ["Médio", "medio", "GIGANTE", "", " MEDIO"]) {
      assert.throws(() => setPorte(invalid), CHECK_FAILED, invalid);
    }
  });

  test("a hora do agendamento e o horário padrão do pet só aceitam HH:MM de 00:00 a 23:59", async () => {
    const { db, petId, appointmentId } = await databaseWithAppointment();
    const setters = [
      (value) => db.prepare("UPDATE appointments SET time = ? WHERE id = ?").run(value, appointmentId),
      (value) => db.prepare("UPDATE pets SET default_time = ? WHERE id = ?").run(value, petId),
    ];
    for (const set of setters) {
      for (const valid of ["00:00", "09:30", "19:59", "23:59"]) set(valid);
      for (const invalid of ["24:00", "9:30", "09:60", "0930", "", " 09:30", "ab:cd", "09:30:00", 930]) {
        assert.throws(() => set(invalid), CHECK_FAILED, String(invalid));
      }
      assert.throws(() => set(null), /NOT NULL constraint failed/);
    }
  });

  test("o CHECK do horário aceita o mesmo que o campo de horário do app", async () => {
    const { db, appointmentId } = await databaseWithAppointment();
    const field = time("Horário inválido.");
    const candidates = ["00:00", "07:05", "23:59", " 09:30 ", "24:00", "7:05", "12:7", "12:60", "1a:00", "--:--"];
    for (const candidate of candidates) {
      const parsed = field.safeParse(candidate);
      const save = () =>
        db.prepare("UPDATE appointments SET time = ? WHERE id = ?").run(parsed.success ? parsed.data : candidate, appointmentId);
      if (parsed.success) assert.doesNotThrow(save, candidate);
      else assert.throws(save, CHECK_FAILED, candidate);
    }
  });

  test("o serviço e a forma de pagamento precisam existir na lista", async () => {
    const { db, petId, appointmentId } = await databaseWithAppointment();

    assert.throws(() => db.prepare("UPDATE appointments SET service_id = 999 WHERE id = ?").run(appointmentId), FOREIGN_KEY_FAILED);
    assert.throws(
      () => db.prepare("UPDATE appointments SET payment_method_id = 999, payment_method_name = 'PIX' WHERE id = ?").run(appointmentId),
      FOREIGN_KEY_FAILED,
    );
    assert.throws(() => db.prepare("UPDATE pets SET default_service_id = 999 WHERE id = ?").run(petId), FOREIGN_KEY_FAILED);
    // Gravar pelo nome: o nome fora da lista não acha id, e o NOT NULL recusa.
    assert.throws(() => insertAppointment(db, petId, { service: "Tosa na máquina" }), /NOT NULL constraint failed/);
    assert.throws(() => insertPet(db, { owner_id: insertOwner(db), default_service: "Spa" }), /NOT NULL constraint failed/);
  });

  test("um serviço ou forma de pagamento em uso não pode ser apagado", async () => {
    const { db, appointmentId } = await databaseWithAppointment();
    saveAppointment(db, appointmentId, { service: "Banho e Tosa", payment_method: "PIX", is_paid: 1 });

    assert.throws(() => db.prepare("DELETE FROM services WHERE name = 'Banho e Tosa'").run(), FOREIGN_KEY_FAILED);
    assert.throws(() => db.prepare("DELETE FROM payment_methods WHERE name = 'PIX'").run(), FOREIGN_KEY_FAILED);
  });

  test("a forma de pagamento não se repete na lista", async () => {
    const db = await createDatabase();
    assert.throws(
      () => db.prepare("INSERT INTO payment_methods (name) VALUES ('PIX')").run(),
      /UNIQUE constraint failed/,
    );
  });

  test("os valores fixos do app estão no banco: todo porte passa no CHECK e todo serviço está na lista", async () => {
    const db = await createDatabase();
    const services = db.prepare(LIST_SERVICE_TYPES_SQL).all().map(({ name }) => name);
    for (const service of Object.values(ServiceName)) assert.ok(services.includes(service), service);
    const ownerId = insertOwner(db);
    for (const size of Object.values(PetSize)) insertPet(db, { owner_id: ownerId, size });
  });

  test("o índice repetido saiu, e a busca pelo pet continua usando índice", async () => {
    const db = await createDatabase();
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all().map(({ name }) => name);
    assert.ok(!indexes.includes("idx_appointments_pet_id"));

    const plan = db
      .prepare("EXPLAIN QUERY PLAN SELECT id FROM appointments WHERE pet_id = ?")
      .all(1)
      .map(({ detail }) => detail)
      .join(" | ");
    assert.match(plan, /SEARCH appointments USING (COVERING )?INDEX/);
  });
});

describe("o serviço e a forma de pagamento pelo nome, como as telas usam", () => {
  test("gravar pelo nome guarda o id, e ler traz o nome de volta", async () => {
    const { db, petId } = await databaseWithAppointment();
    const id = insertAppointment(db, petId, { service: "Banho e Higiênica", payment_method: "Cartão de Débito" });

    assert.deepEqual(storedNames(db, id), {
      service_id: idOf(db, "services", "name", "Banho e Higiênica"),
      service_name: "Banho e Higiênica",
      payment_method_id: idOf(db, "payment_methods", "name", "Cartão de Débito"),
      payment_method_name: "Cartão de Débito",
    });
    const shown = db.prepare(FIND_APPOINTMENT_SQL).get(id);
    assert.equal(shown.service, "Banho e Higiênica");
    assert.equal(shown.payment_method, "Cartão de Débito");
  });

  test("sem forma de pagamento, grava nulo e a tela lê o texto vazio", async () => {
    const { db, appointmentId } = await databaseWithAppointment();

    const stored = storedNames(db, appointmentId);
    assert.deepEqual([stored.payment_method_id, stored.payment_method_name], [null, null]);
    assert.equal(db.prepare(FIND_APPOINTMENT_SQL).get(appointmentId).payment_method, "");
    assert.equal(db.prepare(LIST_APPOINTMENTS_BETWEEN_SQL).all(isoDate(0), isoDate(9))[0].payment_method, "");
  });

  test("o pet guarda o serviço padrão pelo id, e a remarcação usa o mesmo serviço na agenda", async () => {
    const db = await createDatabase();
    const pet = await createPet(db, {
      owner_id: insertOwner(db), default_service: "Banho e Tosa", reschedule_active: 1, package_frequency: 4,
      package_start_date: isoDate(1), package_price: 32000,
    });

    assert.equal(db.prepare(FIND_PET_SQL).get(pet.id).default_service, "Banho e Tosa");
    const agenda = pendingAutoOf(db, pet.id);
    assert.ok(agenda.length > 0);
    assert.ok(agenda.every((a) => a.service === "Banho e Tosa"));

    const [first] = agenda;
    await packageScheduleOf(db).updateAppointment(first.id, { ...first, completed: 1, service: "Banho" });
    assert.equal(pendingAutoOf(db, pet.id).at(-1).service, "Banho", "o próximo leva o serviço do concluído");
  });

  test("a conferência das listas recusa o que a tela não oferece", async () => {
    const db = await createDatabase();
    const choices = {
      services: db.prepare(LIST_SERVICE_TYPES_SQL).all(),
      paymentMethods: db.prepare(LIST_PAYMENT_METHODS_SQL).all(),
    };
    const notFound = (message) => ({ name: "AppError", code: "NOT_FOUND", message });

    assert.doesNotThrow(() => assertAppointmentChoices({ service: "Banho", payment_method: "PIX" }, choices));
    assert.doesNotThrow(() => assertAppointmentChoices({ service: "Banho", payment_method: "" }, choices));
    for (const service of ["Tosa", "banho", "Banho'; DROP TABLE appointments; --", ""]) {
      assert.throws(
        () => assertAppointmentChoices({ service, payment_method: "" }, choices),
        notFound(MESSAGES.appointment.serviceNotFound),
        service,
      );
    }
    for (const payment_method of ["Pix", "Cheque", "0"]) {
      assert.throws(
        () => assertAppointmentChoices({ service: "Banho", payment_method }, choices),
        notFound(MESSAGES.appointment.paymentMethodNotFound),
        payment_method,
      );
    }
  });
});

describe("o agendamento guarda o nome da época (histórico)", () => {
  test("criar grava o nome do serviço e da forma de pagamento escolhidos", async () => {
    const { db, petId } = await databaseWithAppointment();
    const id = insertAppointment(db, petId, { service: "Banho e Tosa", payment_method: "Dinheiro" });

    const stored = storedNames(db, id);
    assert.deepEqual([stored.service_name, stored.payment_method_name], ["Banho e Tosa", "Dinheiro"]);
    assert.equal(stored.service_id, idOf(db, "services", "name", "Banho e Tosa"));
    assert.equal(stored.payment_method_id, idOf(db, "payment_methods", "name", "Dinheiro"));
  });

  test("renomear o serviço ou a forma de pagamento não muda os agendamentos antigos", async () => {
    const { db, petId } = await databaseWithAppointment();
    const old = insertAppointment(db, petId, { service: "Banho e Tosa", payment_method: "PIX" });
    db.prepare("UPDATE services SET name = 'Banho e Tosa Premium' WHERE name = 'Banho e Tosa'").run();
    db.prepare("UPDATE payment_methods SET name = 'Pix' WHERE name = 'PIX'").run();

    const shown = db.prepare(FIND_APPOINTMENT_SQL).get(old);
    assert.deepEqual([shown.service, shown.payment_method], ["Banho e Tosa", "PIX"], "o histórico mostra o nome da época");
    assert.equal(db.prepare(LIST_APPOINTMENTS_BETWEEN_SQL).all(isoDate(0), isoDate(9)).at(-1).service, "Banho e Tosa");

    // A lista oferece só o nome novo, e o agendamento novo grava o nome novo.
    const services = db.prepare(LIST_SERVICE_TYPES_SQL).all().map(({ name }) => name);
    assert.ok(services.includes("Banho e Tosa Premium") && !services.includes("Banho e Tosa"));
    const created = insertAppointment(db, petId, { service: "Banho e Tosa Premium", payment_method: "Pix" });
    const createdNames = storedNames(db, created);
    assert.deepEqual([createdNames.service_name, createdNames.payment_method_name], ["Banho e Tosa Premium", "Pix"]);
    assert.equal(createdNames.service_id, storedNames(db, old).service_id, "o mesmo item da lista");
    assert.throws(() => insertAppointment(db, petId, { service: "Banho e Tosa" }), /NOT NULL constraint failed/);
  });

  test("editar sem trocar mantém o id e o nome, mesmo depois de renomear; trocar grava o nome novo", async () => {
    const { db, petId } = await databaseWithAppointment();
    const id = insertAppointment(db, petId, { service: "Banho", payment_method: "PIX" });
    const before = storedNames(db, id);
    db.prepare("UPDATE services SET name = 'Banho completo' WHERE name = 'Banho'").run();
    db.prepare("UPDATE payment_methods SET name = 'Pix' WHERE name = 'PIX'").run();

    saveAppointment(db, id, { price: 7000, notes: "Só mudei o valor" });
    assert.deepEqual(storedNames(db, id), before, "editar outro campo não troca o item");

    saveAppointment(db, id, { service: "Banho completo", payment_method: "Pix" });
    assert.deepEqual(
      storedNames(db, id),
      { service_id: before.service_id, service_name: "Banho completo", payment_method_id: before.payment_method_id, payment_method_name: "Pix" },
      "escolher o nome novo do mesmo item atualiza o nome",
    );

    saveAppointment(db, id, { service: "Banho e Tosa", payment_method: "Dinheiro" });
    assert.deepEqual(storedNames(db, id), {
      service_id: idOf(db, "services", "name", "Banho e Tosa"),
      service_name: "Banho e Tosa",
      payment_method_id: idOf(db, "payment_methods", "name", "Dinheiro"),
      payment_method_name: "Dinheiro",
    });

    const chosen = storedNames(db, id);
    assert.throws(() => saveAppointment(db, id, { service: "Spa" }), /NOT NULL constraint failed/);
    assert.throws(() => saveAppointment(db, id, { payment_method: "Cheque" }), CHECK_FAILED);
    assert.deepEqual(storedNames(db, id), chosen, "a troca recusada não muda nada");
  });

  test("pagamento vazio fica com id e nome nulos", async () => {
    const { db, petId } = await databaseWithAppointment();
    const id = insertAppointment(db, petId, { payment_method: "PIX" });

    saveAppointment(db, id, { payment_method: "" });

    const stored = storedNames(db, id);
    assert.deepEqual([stored.payment_method_id, stored.payment_method_name], [null, null]);
    assert.equal(db.prepare(FIND_APPOINTMENT_SQL).get(id).payment_method, "");
  });

  test("o CHECK recusa id sem nome, nome sem id e serviço sem nome", async () => {
    const { db, appointmentId } = await databaseWithAppointment();
    const set = (assignments) => () =>
      db.prepare(`UPDATE appointments SET ${assignments} WHERE id = ?`).run(appointmentId);

    assert.throws(set("payment_method_id = 4"), CHECK_FAILED, "id sem nome");
    assert.throws(set("payment_method_name = 'PIX'"), CHECK_FAILED, "nome sem id");
    for (const blank of ["''", "'   '"]) assert.throws(set(`service_name = ${blank}`), CHECK_FAILED, blank);
    assert.throws(set("service_name = NULL"), /NOT NULL constraint failed/);

    assert.doesNotThrow(set("payment_method_id = 4, payment_method_name = 'PIX'"));
    assert.doesNotThrow(set("payment_method_id = NULL, payment_method_name = NULL"));
  });

  test("concluir um automático cria o próximo com o nome atual do id", async () => {
    const db = await createDatabase();
    const pet = await createPet(db, {
      owner_id: insertOwner(db), default_service: "Banho", reschedule_active: 1, package_frequency: 4,
      package_start_date: isoDate(1), package_price: 32000,
    });
    const [first] = pendingAutoOf(db, pet.id);
    assert.equal(first.service, "Banho");
    db.prepare("UPDATE services SET name = 'Banho completo' WHERE name = 'Banho'").run();

    await packageScheduleOf(db).updateAppointment(first.id, { ...first, completed: 1 });

    const next = pendingAutoOf(db, pet.id).at(-1);
    assert.equal(next.service, "Banho completo", "o próximo é novo, então leva o nome de hoje");
    assert.equal(storedNames(db, next.id).service_id, storedNames(db, first.id).service_id);
    assert.equal(db.prepare(FIND_APPOINTMENT_SQL).get(first.id).service, "Banho", "o concluído guarda o da época");
  });
});

describe("o dinheiro não aceita valor negativo", () => {
  test("o valor do agendamento e o do pacote do pet recusam negativo e aceitam zero (o pacote, também nulo)", async () => {
    const { db, petId, appointmentId } = await databaseWithAppointment();

    for (const invalid of [-1, -1150, -100_000_000]) {
      assert.throws(() => db.prepare("UPDATE appointments SET price = ? WHERE id = ?").run(invalid, appointmentId), CHECK_FAILED, `valor ${invalid}`);
      assert.throws(() => db.prepare("UPDATE pets SET package_price = ? WHERE id = ?").run(invalid, petId), CHECK_FAILED, `pacote ${invalid}`);
    }
    assert.throws(() => insertAppointment(db, petId, { price: -1 }), CHECK_FAILED);
    assert.throws(() => insertPet(db, { owner_id: insertOwner(db), package_price: -1 }), CHECK_FAILED);

    db.prepare("UPDATE appointments SET price = 0 WHERE id = ?").run(appointmentId);
    db.prepare("UPDATE pets SET package_price = 0 WHERE id = ?").run(petId);
    db.prepare("UPDATE pets SET package_price = NULL WHERE id = ?").run(petId);
    assert.throws(() => db.prepare("UPDATE appointments SET price = NULL WHERE id = ?").run(appointmentId), /NOT NULL constraint failed/);
  });
});

// ── Migração da versão 5 para a 6 ─────────────────────────────────────────

/** O INSERT do agendamento da versão 5, com o serviço e o pagamento pelo nome. */
function insertV5Appointment(db, petId, fields) {
  const a = {
    service: "Banho", date: isoDate(-3), time: "10:00", deliver_pet: 0, completed: 0, is_auto: 0,
    notes: null, price: 5000, payment_method: "0", is_paid: 0, ...fields,
  };
  const result = db
    .prepare(
      `INSERT INTO appointments (pet_id, servico, data, hora, entregar_pet, concluido, is_auto_agen, observacao,
        valor, tipo_pgto, ta_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(petId, a.service, a.date, a.time, a.deliver_pet, a.completed, a.is_auto, a.notes, a.price,
      a.payment_method, a.is_paid);
  return Number(result.lastInsertRowid);
}

/**
 * Um banco da versão 5 com o que um aparelho antigo pode ter: o porte pelo rótulo, horário nulo ou fora
 * do formato, flag diferente de 0 e 1, nome de serviço com espaço, vazio ou fora da lista, o "0" do
 * DEFAULT antigo no pagamento e um agendamento de um pet que não existe mais (referência quebrada, que
 * o migrator tolera se a migração não criar outra).
 */
async function v5WithOldData() {
  const db = await databaseAt(5);
  const ownerId = insertOwner(db, { name: "Conceição D'Ávila" });
  const inactiveOwner = insertOwner(db, { name: "Dono com flag 5", phone: "(44) 90000-0001" });
  db.prepare("UPDATE owners SET is_ativo = 5 WHERE id = ?").run(inactiveOwner);
  db.prepare("UPDATE configs SET is_ativo = 7 WHERE id = 1").run();

  const pets = {
    pacoca: insertPet(db, { owner_id: ownerId, name: "Paçoca", size: "Pequeno", default_service: "Banho e Tosa", default_time: "7:05" }),
    mel: insertPet(db, { owner_id: ownerId, name: "Mel", size: "Médio", default_service: " Hidratação ", default_time: null }),
    thor: insertPet(db, { owner_id: ownerId, name: "Thor", size: "Grandão", default_service: "", default_time: "25:00" }),
    bob: insertPet(db, { owner_id: inactiveOwner, name: "Bob", size: "LARGE", default_time: "14:30" }),
    xis: insertPet(db, { owner_id: ownerId, name: "Xis", size: "gigante" }),
  };
  db.prepare("UPDATE pets SET is_ativo = 2, remarcacao_ativa = -1 WHERE id = ?").run(pets.bob.id);

  db.exec("PRAGMA foreign_keys = OFF;");
  const appointments = {
    normal: insertV5Appointment(db, pets.pacoca.id, { payment_method: "PIX", completed: 1, is_paid: 1, notes: "Tem medo de secador 'barulhento'" }),
    spaces: insertV5Appointment(db, pets.mel.id, { service: " Banho e Tosa ", payment_method: "", time: "9:30" }),
    unknown: insertV5Appointment(db, pets.mel.id, { service: "Hidratação", payment_method: "Vale-presente", time: "24:00" }),
    blank: insertV5Appointment(db, pets.pacoca.id, { service: "", time: "abc", deliver_pet: 2, completed: 3, is_auto: 9, is_paid: -1 }),
    orphan: insertV5Appointment(db, 999, { service: "  ", time: "" }),
  };
  db.exec("PRAGMA foreign_keys = ON;");
  return { db, pets, appointments };
}

const migrate = (db) => migrateDatabase(asMigrationDatabase(db), MIGRATIONS);
const foreignKeyProblems = (db) => db.prepare("SELECT \"table\", rowid FROM pragma_foreign_key_check").all().map((row) => ({ ...row }));

describe("migração para a versão 6", () => {
  test("um banco da versão 5 com dados sobe sem perder nenhum registro, e o esquema fica igual ao novo", async () => {
    const { db } = await v5WithOldData();
    // A tabela de antes da versão 7 e a de hoje.
    const tables = [["owners", "owners"], ["pets", "pets"], ["appointments", "appointments"],
      ["service_type", "services"], ["payment_methods", "payment_methods"]];
    const idsBefore = Object.fromEntries(tables.map(([old, table]) => [table, rows(db, old).map(({ id }) => id)]));
    const sequencesBefore = db.prepare("SELECT name, seq FROM sqlite_sequence ORDER BY name").all();
    const kept = ["id", "pet_id", "date", "price", "created_at"];
    const keptOf = (db) => rows(db, "appointments").map((row) => Object.fromEntries(kept.map((c) => [c, row[c]])));
    const appointmentsBefore = keptOf(db);
    const problemsBefore = foreignKeyProblems(db);
    assert.equal(problemsBefore.length, 1, "só o agendamento do pet que não existe");

    assert.equal(await migrate(db), MIGRATIONS.length);

    for (const [, table] of tables.slice(0, 3)) {
      assert.deepEqual(rows(db, table).map(({ id }) => id), idsBefore[table], `${table}: os mesmos ids`);
    }
    assert.deepEqual(keptOf(db), appointmentsBefore, "o resto do agendamento não muda");
    assert.deepEqual(
      db.prepare("SELECT name, seq FROM sqlite_sequence WHERE name IN ('owners', 'pets', 'appointments') ORDER BY name").all(),
      sequencesBefore.filter(({ name }) => ["owners", "pets", "appointments"].includes(name)),
      "a contagem de ids continua de onde parou",
    );
    assert.deepEqual(schemaObjects(db), schemaObjects(await createDatabase()));
    assert.deepEqual(foreignKeyProblems(db), problemsBefore, "nenhuma referência quebrada nova");
  });

  test("o nome do serviço e do pagamento vira o id do mesmo nome, e o que não estava na lista entra nela", async () => {
    const { db, pets, appointments } = await v5WithOldData();
    await migrate(db);
    const shown = (id) => db.prepare(FIND_APPOINTMENT_SQL).get(id);

    assert.deepEqual([shown(appointments.normal).service, shown(appointments.normal).payment_method], ["Banho", "PIX"]);
    assert.deepEqual([shown(appointments.spaces).service, shown(appointments.spaces).payment_method], ["Banho e Tosa", ""]);
    assert.deepEqual([shown(appointments.unknown).service, shown(appointments.unknown).payment_method], ["Hidratação", "Vale-presente"]);
    // Sem nome, o agendamento fica com o serviço padrão do pet.
    assert.equal(shown(appointments.blank).service, "Banho e Tosa");
    assert.equal(shown(appointments.blank).payment_method, "", "o 0 do DEFAULT antigo é a forma não informada");
    const orphan = db.prepare("SELECT service_id, time FROM appointments WHERE id = ?").get(appointments.orphan);
    assert.equal(orphan.service_id, idOf(db, "services", "name", "Banho"), "sem nome e sem pet, o Banho");
    assert.equal(orphan.time, "00:00");

    const petService = (pet) => db.prepare(FIND_PET_SQL).get(pet.id).default_service;
    assert.equal(petService(pets.pacoca), "Banho e Tosa");
    assert.equal(petService(pets.mel), "Banho", "o serviço padrão fora dos três vira o Banho");
    assert.equal(observationOf(db, "pets", pets.mel.id), 'Serviço padrão antigo: "Hidratação".');
    assert.equal(petService(pets.thor), "Banho", "sem serviço, o Banho do DEFAULT antigo");

    // O que não estava na lista entra nela, mas oculto: o formulário não oferece (ver "itens ocultos").
    const everyService = db.prepare("SELECT name FROM services ORDER BY name").all().map(({ name }) => name);
    assert.deepEqual(everyService, ["Banho", "Banho e Higiênica", "Banho e Tosa", "Hidratação"]);
    const everyMethod = db.prepare("SELECT name FROM payment_methods ORDER BY id").all().map(({ name }) => name);
    assert.deepEqual(everyMethod, ["Cartão de Crédito", "Cartão de Débito", "Dinheiro", "PIX", "Outro", "Vale-presente"]);
    assert.equal(storedNames(db, appointments.unknown).service_name, "Hidratação");
    assert.equal(storedNames(db, appointments.unknown).payment_method_name, "Vale-presente");
    assert.equal(storedNames(db, appointments.blank).service_name, "Banho e Tosa");
  });

  test("o porte, os horários e os flags fora do domínio seguem as regras do app", async () => {
    const { db, pets, appointments } = await v5WithOldData();
    await migrate(db);
    const pet = (p) => db.prepare("SELECT size, default_time, is_active, reschedule_active FROM pets WHERE id = ?").get(p.id);
    const appointment = (id) =>
      db.prepare("SELECT time, deliver_pet, completed, is_auto, is_paid FROM appointments WHERE id = ?").get(id);

    assert.deepEqual({ ...pet(pets.pacoca) }, { size: "SMALL", default_time: "07:05", is_active: 1, reschedule_active: 0 });
    assert.deepEqual({ ...pet(pets.mel) }, { size: "MEDIUM", default_time: "00:00", is_active: 1, reschedule_active: 0 });
    assert.deepEqual({ ...pet(pets.thor) }, { size: "EXTRA_LARGE", default_time: "00:00", is_active: 1, reschedule_active: 0 });
    assert.deepEqual({ ...pet(pets.bob) }, { size: "LARGE", default_time: "14:30", is_active: 1, reschedule_active: 1 });
    assert.equal(pet(pets.xis).size, "MEDIUM", "o porte desconhecido fica com o padrão do formulário");

    assert.equal(appointment(appointments.normal).time, "10:00");
    assert.equal(appointment(appointments.spaces).time, "09:30");
    assert.equal(appointment(appointments.unknown).time, "00:00");
    assert.deepEqual(
      { ...appointment(appointments.blank) },
      { time: "00:00", deliver_pet: 1, completed: 1, is_auto: 1, is_paid: 1 },
    );
    assert.equal(db.prepare("SELECT is_active FROM owners WHERE name = 'Dono com flag 5'").get().is_active, 1);
    assert.equal(db.prepare("SELECT value FROM settings WHERE key = 'theme'").get().value, "dark", "o flag 7 era ligado");
  });

  test("a lista de pagamento com os ids da carga de maio de 2026 e um nome repetido continua certa", async () => {
    const db = await databaseAt(5);
    // A carga de maio tinha o PIX no 3 e o Dinheiro no 4, e o INSERT OR IGNORE da versão 1 não trocou.
    db.exec(`
      UPDATE payment_methods SET tipo_pgto = 'PIX' WHERE id = 3;
      UPDATE payment_methods SET tipo_pgto = 'Dinheiro' WHERE id = 4;
      INSERT INTO payment_methods (tipo_pgto) VALUES ('PIX');
    `);
    const pet = insertPet(db, { owner_id: insertOwner(db) });
    const pix = insertV5Appointment(db, pet.id, { payment_method: "PIX" });
    const cash = insertV5Appointment(db, pet.id, { payment_method: "Dinheiro" });

    await migrate(db);

    assert.equal(db.prepare("SELECT payment_method_id FROM appointments WHERE id = ?").get(pix).payment_method_id, 3);
    assert.equal(db.prepare(FIND_APPOINTMENT_SQL).get(pix).payment_method, "PIX");
    assert.equal(db.prepare(FIND_APPOINTMENT_SQL).get(cash).payment_method, "Dinheiro");
    assert.equal(db.prepare("SELECT COUNT(*) AS total FROM payment_methods WHERE name = 'PIX'").get().total, 1);
  });

  test("depois da migração, o dado antigo pode ser editado e concluído pelo app", async () => {
    const { db, appointments } = await v5WithOldData();
    await migrate(db);
    const old = db.prepare(FIND_APPOINTMENT_SQL).get(appointments.unknown);

    await packageScheduleOf(db).updateAppointment(old.id, { ...old, completed: 1, is_paid: 1 });

    const saved = db.prepare(FIND_APPOINTMENT_SQL).get(old.id);
    assert.deepEqual([saved.service, saved.payment_method, saved.completed], ["Hidratação", "Vale-presente", 1]);
  });
});

// ── Itens ocultos, serviços padrão e notas da migração ────────────────────

const notFoundError = (message) => ({ name: "AppError", code: "NOT_FOUND", message });
const namesOf = (db, sql, column) => db.prepare(sql).all().map((row) => row[column]);
const OBSERVATION_COLUMN = { pets: "notes", appointments: "notes" };
const observationOf = (db, table, id) =>
  db.prepare(`SELECT ${OBSERVATION_COLUMN[table]} AS text FROM ${table} WHERE id = ?`).get(id).text;

describe("itens ocultos da migração", () => {
  test("as listas do formulário não trazem os ocultos, e o histórico mostra o nome", async () => {
    const { db, appointments } = await v5WithOldData();
    await migrate(db);

    assert.deepEqual(namesOf(db, LIST_SERVICE_TYPES_SQL, "name"), ["Banho", "Banho e Higiênica", "Banho e Tosa"]);
    assert.deepEqual(
      namesOf(db, LIST_PAYMENT_METHODS_SQL, "name"),
      ["Cartão de Crédito", "Cartão de Débito", "Dinheiro", "PIX", "Outro"],
    );
    assert.deepEqual(namesOf(db, "SELECT name FROM services WHERE is_active = 0", "name"), ["Hidratação"]);
    assert.deepEqual(namesOf(db, "SELECT name FROM payment_methods WHERE is_active = 0", "name"), ["Vale-presente"]);

    const shown = db.prepare(FIND_APPOINTMENT_SQL).get(appointments.unknown);
    assert.deepEqual([shown.service, shown.payment_method], ["Hidratação", "Vale-presente"]);
    const inRange = db.prepare(LIST_APPOINTMENTS_BETWEEN_SQL).all(isoDate(-4), isoDate(-2));
    assert.ok(inRange.some((a) => a.service === "Hidratação" && a.payment_method === "Vale-presente"));
  });

  test("o item que já estava na lista continua ativo", async () => {
    const { db } = await v5WithOldData();
    await migrate(db);

    assert.deepEqual(
      namesOf(db, "SELECT name FROM services WHERE is_active = 1 ORDER BY id", "name"),
      ["Banho", "Banho e Tosa", "Banho e Higiênica"],
    );
    assert.equal(db.prepare("SELECT COUNT(*) AS total FROM payment_methods WHERE is_active = 1").get().total, 5);
  });

  test("a conferência aceita o oculto igual ao gravado e recusa o oculto na criação e na troca", async () => {
    const { db } = await v5WithOldData();
    await migrate(db);
    const choices = {
      services: db.prepare(LIST_SERVICE_TYPES_SQL).all(),
      paymentMethods: db.prepare(LIST_PAYMENT_METHODS_SQL).all(),
    };
    const hidden = { service: "Hidratação", payment_method: "Vale-presente" };
    const regular = { service: "Banho", payment_method: "PIX" };
    const serviceNotFound = notFoundError(MESSAGES.appointment.serviceNotFound);
    const paymentNotFound = notFoundError(MESSAGES.appointment.paymentMethodNotFound);

    // Editar o que está gravado, sem trocar o serviço nem a forma de pagamento.
    assert.doesNotThrow(() => assertAppointmentChoices(hidden, choices, hidden));
    assert.doesNotThrow(() => assertAppointmentChoices({ ...hidden, payment_method: "PIX" }, choices, hidden), "trocou só o pagamento");
    assert.doesNotThrow(() => assertAppointmentChoices({ ...hidden, service: "Banho" }, choices, hidden), "trocou só o serviço");
    // Criar: só item ativo.
    assert.throws(() => assertAppointmentChoices(hidden, choices), serviceNotFound);
    assert.throws(() => assertAppointmentChoices({ service: "Banho", payment_method: "Vale-presente" }, choices), paymentNotFound);
    // Trocar o gravado por um oculto: recusado.
    assert.throws(() => assertAppointmentChoices({ ...regular, service: "Hidratação" }, choices, regular), serviceNotFound);
    assert.throws(() => assertAppointmentChoices({ ...regular, payment_method: "Vale-presente" }, choices, regular), paymentNotFound);
    // O oculto de outro agendamento não vale: só o gravado neste.
    assert.throws(() => assertAppointmentChoices(hidden, choices, { service: "Hidratação", payment_method: "" }), paymentNotFound);
  });

  test("gravar com um nome oculto é recusado, e is_active só aceita 0 ou 1", async () => {
    const { db, pets } = await v5WithOldData();
    await migrate(db);

    assert.throws(() => insertAppointment(db, pets.pacoca.id, { service: "Hidratação" }), /NOT NULL constraint failed: appointments.service_id/);
    assert.throws(() => insertAppointment(db, pets.pacoca.id, { payment_method: "Vale-presente" }), CHECK_FAILED);
    for (const table of ["services", "payment_methods"]) {
      for (const invalid of [2, -1, "sim", null]) {
        assert.throws(() => db.prepare(`UPDATE ${table} SET is_active = ? WHERE id = 1`).run(invalid), invalid === null ? /NOT NULL/ : CHECK_FAILED, `${table} ${invalid}`);
      }
    }
  });

  test("editar o agendamento com item oculto, sem trocá-lo, funciona e mantém o id, mesmo renomeado", async () => {
    const { db, appointments } = await v5WithOldData();
    await migrate(db);
    const before = storedNames(db, appointments.unknown);
    db.prepare("UPDATE services SET name = 'Hidratação premium' WHERE name = 'Hidratação'").run();

    saveAppointment(db, appointments.unknown, { notes: "Editei", completed: 1, is_paid: 1 });

    assert.deepEqual(storedNames(db, appointments.unknown), before);
    const saved = db.prepare(FIND_APPOINTMENT_SQL).get(appointments.unknown);
    assert.deepEqual([saved.service, saved.payment_method, saved.completed, saved.notes], ["Hidratação", "Vale-presente", 1, "Editei"]);
    // Trocar para um item ativo funciona; voltar ao oculto, não.
    saveAppointment(db, appointments.unknown, { service: "Banho", payment_method: "PIX" });
    assert.throws(() => saveAppointment(db, appointments.unknown, { service: "Hidratação premium" }), /NOT NULL constraint failed/);
  });
});

describe("serviços padrão garantidos pela migração", () => {
  test("uma versão 5 sem o Banho recebe o Banho ativo, mesmo com ele só no texto dos agendamentos", async () => {
    const db = await databaseAt(5);
    db.prepare("DELETE FROM service_type WHERE servico = 'Banho'").run();
    const ownerId = insertOwner(db);
    const withoutService = insertPet(db, { owner_id: ownerId, name: "Sem serviço", default_service: "" });
    const onlyInText = insertV5Appointment(db, withoutService.id, { service: "Banho" });
    db.exec("PRAGMA foreign_keys = OFF;");
    const orphan = insertV5Appointment(db, 999, { service: "" });
    db.exec("PRAGMA foreign_keys = ON;");

    await migrate(db);

    const bath = db.prepare("SELECT id, is_active FROM services WHERE name = 'Banho'").all();
    assert.equal(bath.length, 1);
    assert.equal(bath[0].is_active, 1, "ativo, e não oculto como um nome desconhecido");
    assert.equal(petRow(db, withoutService.id).default_service_id, bath[0].id);
    for (const id of [onlyInText, orphan]) {
      assert.deepEqual(
        { ...db.prepare("SELECT service_id, service_name FROM appointments WHERE id = ?").get(id) },
        { service_id: bath[0].id, service_name: "Banho" },
      );
    }
    assert.ok(namesOf(db, LIST_SERVICE_TYPES_SQL, "name").includes("Banho"));
    assert.equal(foreignKeyProblems(db).length, 1, "só o agendamento do pet que não existe, que já era assim");
  });

  test("os três serviços do formulário do pet ficam ativos, e um banco novo não fica com repetidos", async () => {
    const db = await databaseAt(5);
    db.prepare("DELETE FROM service_type WHERE servico IN ('Banho e Tosa', 'Banho e Higiênica')").run();
    await migrate(db);
    const fresh = await createDatabase();

    for (const database of [db, fresh]) {
      assert.deepEqual(
        namesOf(database, "SELECT name FROM services WHERE is_active = 1 ORDER BY name", "name"),
        [...Object.values(ServiceName)].sort(),
      );
      assert.equal(database.prepare("SELECT COUNT(*) AS total FROM services").get().total, 3);
    }
  });
});

describe("notas da migração com o valor antigo", () => {
  /** Um banco da versão 5 com valores que a conversão joga fora, e valores que ela só normaliza. */
  async function v5WithLostValues() {
    const db = await databaseAt(5);
    const owner_id = insertOwner(db);
    const pets = {
      allThree: insertPet(db, { owner_id, name: "Xyz", size: "xyz", default_service: "Hidratação", notes: "Alérgico a xampu forte", default_time: "25:00", package_price: -1150 }),
      onlyPorte: insertPet(db, { owner_id, name: "Abc", size: "abc", notes: null }),
      cents: insertPet(db, { owner_id, name: "Centavos", notes: "Dócil", package_price: -50 }),
      longPorte: insertPet(db, { owner_id, name: "Longo", size: "x".repeat(60) }),
      normalized: insertPet(db, { owner_id, name: "Normal", size: "Médio", notes: "Sem nota", default_time: "9:30" }),
      empty: insertPet(db, { owner_id, name: "Vazio", size: "", notes: null, default_time: null }),
    };
    const appointments = {
      badTime: insertV5Appointment(db, pets.allThree.id, { time: "abc", notes: "Tem medo de secador" }),
      badTimeNoText: insertV5Appointment(db, pets.allThree.id, { time: "25:00" }),
      negative: insertV5Appointment(db, pets.allThree.id, { time: "9:30", price: -1150 }),
      cents: insertV5Appointment(db, pets.allThree.id, { price: -50, notes: "Pagou fiado" }),
      both: insertV5Appointment(db, pets.allThree.id, { time: "abc", price: -1150 }),
      normalized: insertV5Appointment(db, pets.allThree.id, { time: "9:30", notes: "Sem nota" }),
      emptyTime: insertV5Appointment(db, pets.allThree.id, { time: "" }),
    };
    return { db, pets, appointments };
  }

  test("o porte, o horário e o valor perdidos ganham a nota, sem apagar a observação que já existia", async () => {
    const { db, pets, appointments } = await v5WithLostValues();
    await migrate(db);
    const petNote = (pet) => observationOf(db, "pets", pet.id);
    const appointmentNote = (id) => observationOf(db, "appointments", id);

    // As três notas saem na ordem, depois da observação, que fica intacta.
    assert.equal(
      petNote(pets.allThree),
      'Alérgico a xampu forte\nPorte antigo: "xyz". Serviço padrão antigo: "Hidratação". Horário padrão antigo: "25:00". Valor do pacote antigo: "-11,50".',
    );
    assert.equal(petNote(pets.onlyPorte), 'Porte antigo: "abc".', "sem observação, fica só a nota");
    assert.equal(petNote(pets.cents), 'Dócil\nValor do pacote antigo: "-0,50".');
    assert.equal(petNote(pets.longPorte), `Porte antigo: "${"x".repeat(40)}".`, "o valor citado vai até 40 caracteres");
    assert.deepEqual(
      { ...db.prepare("SELECT size, default_time, package_price FROM pets WHERE id = ?").get(pets.allThree.id) },
      { size: "MEDIUM", default_time: "00:00", package_price: 0 },
    );
    assert.equal(db.prepare(FIND_PET_SQL).get(pets.allThree.id).default_service, "Banho");
    assert.equal(
      db.prepare("SELECT COUNT(*) AS total FROM services WHERE name = 'Hidratação'").get().total,
      0,
      "nenhum agendamento usa o serviço, então ele não fica na lista nem oculto",
    );

    assert.equal(appointmentNote(appointments.badTime), 'Tem medo de secador\nHorário antigo: "abc".');
    assert.equal(appointmentNote(appointments.badTimeNoText), 'Horário antigo: "25:00".');
    assert.equal(appointmentNote(appointments.negative), 'Valor antigo: "-11,50".');
    assert.equal(appointmentNote(appointments.cents), 'Pagou fiado\nValor antigo: "-0,50".');
    assert.equal(appointmentNote(appointments.both), 'Horário antigo: "abc". Valor antigo: "-11,50".');
    assert.deepEqual(
      { ...db.prepare("SELECT time, price FROM appointments WHERE id = ?").get(appointments.negative) },
      { time: "09:30", price: 0 },
      "o horário recuperável é normalizado, e o negativo vira 0",
    );
  });

  test("a normalização e o nulo ou vazio não ganham nota", async () => {
    const { db, pets, appointments } = await v5WithLostValues();
    await migrate(db);

    assert.equal(observationOf(db, "pets", pets.normalized.id), "Sem nota");
    assert.deepEqual(
      { ...db.prepare("SELECT size, default_time FROM pets WHERE id = ?").get(pets.normalized.id) },
      { size: "MEDIUM", default_time: "09:30" },
    );
    assert.equal(observationOf(db, "pets", pets.empty.id), null, "porte vazio e horário nulo");
    assert.deepEqual(
      { ...db.prepare("SELECT size, default_time FROM pets WHERE id = ?").get(pets.empty.id) },
      { size: "MEDIUM", default_time: "00:00" },
    );
    assert.equal(observationOf(db, "appointments", appointments.normalized), "Sem nota");
    assert.equal(observationOf(db, "appointments", appointments.emptyTime), null);
  });

  test("um pacote negativo da versão 5 vira 0, e a agenda que ele gera sai com 0", async () => {
    const db = await databaseAt(5);
    const pet = insertPet(db, {
      owner_id: insertOwner(db), reschedule_active: 1, package_frequency: 4, package_start_date: isoDate(1),
      package_price: -32000, default_time: "10:00",
    });
    await migrate(db);
    assert.equal(petRow(db, pet.id).package_price, 0);

    // Salvar o pet com outro horário refaz a agenda a partir do valor do pacote.
    await savePet(db, { ...petRow(db, pet.id), default_service: "Banho", default_time: "11:00" });

    const agenda = pendingAutoOf(db, pet.id);
    assert.ok(agenda.length > 0);
    assert.ok(agenda.every((a) => a.price === 0), "nenhum automático com valor negativo");
    assert.equal(appointmentsOf(db, pet.id).length, agenda.length);
  });
});

describe("limites de tamanho só no que mudou", () => {
  const tooLong = (field, max) => ({ name: "AppError", code: "VALIDATION", message: MESSAGES.textTooLong(field, max) });

  /** Um banco da versão 5 já migrado, com texto grande que a migração engorda ou deixa oculto. */
  async function migratedWithLongTexts() {
    const db = await databaseAt(5);
    const owner_id = insertOwner(db);
    const pet = insertPet(db, { owner_id, name: "Textão", size: "xyz", notes: "o".repeat(240) });
    const longService = "S".repeat(60);
    const longPayment = "P".repeat(60);
    const appointment = insertV5Appointment(db, pet.id, {
      service: longService, payment_method: longPayment, time: "abc", notes: "a".repeat(240),
    });
    await migrate(db);
    return { db, pet, appointment, longService, longPayment };
  }

  test("a observação do agendamento com a nota passa de 250 e salva sem mudar, mas não cresce", async () => {
    const { db, appointment } = await migratedWithLongTexts();
    const stored = db.prepare(FIND_APPOINTMENT_SQL).get(appointment).notes;
    assert.ok(stored.length > MAX_NOTES_LENGTH, "a nota empurrou a observação para além do limite");

    await editAppointmentLikeTheApp(db, appointment, { is_paid: 1 });
    assert.equal(db.prepare(FIND_APPOINTMENT_SQL).get(appointment).notes, stored);

    const error = tooLong("A observação do agendamento", MAX_NOTES_LENGTH);
    await assert.rejects(editAppointmentLikeTheApp(db, appointment, { notes: `${stored}x` }), error);
    await assert.rejects(editAppointmentLikeTheApp(db, appointment, { notes: "b".repeat(MAX_NOTES_LENGTH + 1) }), error);
    // Encurtar até o limite volta a valer.
    await editAppointmentLikeTheApp(db, appointment, { notes: "b".repeat(MAX_NOTES_LENGTH) });
    assert.equal(db.prepare(FIND_APPOINTMENT_SQL).get(appointment).notes.length, MAX_NOTES_LENGTH);
  });

  test("a observação do pet com a nota passa de 250 e salva sem mudar, mas não cresce", async () => {
    const { db, pet } = await migratedWithLongTexts();
    const stored = db.prepare(FIND_PET_SQL).get(pet.id).notes;
    assert.ok(stored.length > MAX_NOTES_LENGTH);

    await editPetLikeTheApp(db, pet.id, { name: "Textão 2" });
    const saved = db.prepare(FIND_PET_SQL).get(pet.id);
    assert.deepEqual([saved.name, saved.notes], ["Textão 2", stored]);

    await assert.rejects(
      editPetLikeTheApp(db, pet.id, { notes: `${stored}x` }),
      tooLong("A observação do pet", MAX_NOTES_LENGTH),
    );
  });

  test("o nome oculto de 60 caracteres passa sem trocar e é recusado na criação e na troca", async () => {
    const { db, pet, appointment, longService, longPayment } = await migratedWithLongTexts();

    await editAppointmentLikeTheApp(db, appointment, { price: 7000 });
    const saved = db.prepare(FIND_APPOINTMENT_SQL).get(appointment);
    assert.deepEqual([saved.service, saved.payment_method, saved.price], [longService, longPayment, 7000]);

    const input = { ...saved, pet_id: pet.id, notes: null };
    assert.throws(() => parseInput(appointmentSchema, input), tooLong("O serviço", MAX_LIST_ITEM_LENGTH));
    assert.throws(
      () => parseInput(appointmentSchema, { ...input, service: "Banho" }),
      tooLong("O tipo de pagamento", MAX_LIST_ITEM_LENGTH),
    );
    await assert.rejects(
      editAppointmentLikeTheApp(db, appointment, { service: "T".repeat(60) }),
      tooLong("O serviço", MAX_LIST_ITEM_LENGTH),
    );
  });

  test("o teto alto vale mesmo para o texto igual ao gravado", () => {
    const huge = "x".repeat(MAX_STORED_TEXT_LENGTH + 1);
    const schema = appointmentSchemaFor({ service: huge, payment_method: "", notes: huge });
    const input = {
      pet_id: 1, service: "Banho", date: isoDate(1), time: "10:00", price: 0, payment_method: "", notes: huge,
      deliver_pet: 0, completed: 0, is_auto: 0, is_paid: 0,
    };

    assert.throws(() => parseInput(schema, input), tooLong("A observação do agendamento", MAX_NOTES_LENGTH));
    assert.throws(() => parseInput(schema, { ...input, notes: null, service: huge }), tooLong("O serviço", MAX_LIST_ITEM_LENGTH));
  });
});

describe("a edição do agendamento confere as listas com o que está gravado (service)", () => {
  test("sem agendamento gravado, nada vale além da lista ativa", () => {
    assert.equal(storedChoicesOf(null), undefined);
    assert.equal(storedChoicesOf(undefined), undefined);
    assert.deepEqual(
      storedChoicesOf({ id: 3, service: "Hidratação", payment_method: "", notes: "x" }),
      { service: "Hidratação", payment_method: "" },
      "só os nomes gravados vão para a conferência",
    );
  });

  test("editar o agendamento oculto sem trocar passa; trocar para outro oculto ou criar com o oculto, não", async () => {
    const { db, pets, appointments } = await v5WithOldData();
    await migrate(db);
    const before = storedNames(db, appointments.unknown);

    await editAppointmentLikeTheApp(db, appointments.unknown, { notes: "Editei", is_paid: 1 });
    assert.deepEqual(storedNames(db, appointments.unknown), before);
    assert.equal(db.prepare(FIND_APPOINTMENT_SQL).get(appointments.unknown).notes, "Editei");

    // Outro agendamento, que não tem o oculto gravado, não pode escolher o oculto.
    const regular = insertAppointment(db, pets.pacoca.id, { service: "Banho", payment_method: "PIX" });
    await assert.rejects(editAppointmentLikeTheApp(db, regular, { service: "Hidratação" }), {
      code: "NOT_FOUND", message: MESSAGES.appointment.serviceNotFound,
    });
    await assert.rejects(editAppointmentLikeTheApp(db, regular, { payment_method: "Vale-presente" }), {
      code: "NOT_FOUND", message: MESSAGES.appointment.paymentMethodNotFound,
    });
    // O que está gravado vale só para o próprio agendamento: trocar o serviço do oculto por um ativo
    // funciona, e voltar ao oculto não.
    await editAppointmentLikeTheApp(db, appointments.unknown, { service: "Banho e Tosa" });
    await assert.rejects(editAppointmentLikeTheApp(db, appointments.unknown, { service: "Hidratação" }), {
      code: "NOT_FOUND", message: MESSAGES.appointment.serviceNotFound,
    });
  });
});
