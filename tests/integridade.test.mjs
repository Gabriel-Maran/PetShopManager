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
  savePet,
} from "./helpers/database.mjs";
import { migrateDatabase } from "../src/config/migrator.ts";
import { MIGRATIONS } from "../src/config/schema.ts";
import { PorteAnimal, TipoServico } from "../src/config/petEnums.ts";
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
const rows = (db, table) => db.prepare(`SELECT * FROM ${table} ORDER BY id`).all().map((row) => ({ ...row }));
const idOf = (db, table, column, value) =>
  db.prepare(`SELECT id FROM ${table} WHERE ${column} = ?`).get(value)?.id;

const saveAppointment = (db, id, fields) => {
  const current = db.prepare(FIND_APPOINTMENT_SQL).get(id);
  db.prepare(UPDATE_APPOINTMENT_SQL).run(...updateAppointmentParams({ ...current, ...fields }, id));
};
const storedNames = (db, id) =>
  ({ ...db.prepare("SELECT servico_id, servico_nome, tipo_pgto_id, tipo_pgto_nome FROM appointments WHERE id = ?").get(id) });

/** Um banco novo com um dono, um pet e um agendamento, para tentar gravar valores fora do domínio. */
async function databaseWithAppointment() {
  const db = await createDatabase();
  const ownerId = insertOwner(db);
  const pet = await createPet(db, { dono_id: ownerId });
  const appointmentId = insertAppointment(db, pet.id);
  return { db, ownerId, petId: pet.id, appointmentId };
}

describe("o banco recusa valores fora do domínio", () => {
  const FLAGS = [
    ["configs", "is_ativo"],
    ["owners", "is_ativo"],
    ["pets", "remarcacao_ativa"],
    ["pets", "is_ativo"],
    ["appointments", "entregar_pet"],
    ["appointments", "concluido"],
    ["appointments", "is_auto_agen"],
    ["appointments", "ta_pago"],
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
    const setPorte = (porte) => db.prepare("UPDATE pets SET porte = ? WHERE id = ?").run(porte, petId);

    for (const porte of Object.values(PorteAnimal)) setPorte(porte);
    for (const invalid of ["Médio", "medio", "GIGANTE", "", " MEDIO"]) {
      assert.throws(() => setPorte(invalid), CHECK_FAILED, invalid);
    }
  });

  test("a hora do agendamento e o horário padrão do pet só aceitam HH:MM de 00:00 a 23:59", async () => {
    const { db, petId, appointmentId } = await databaseWithAppointment();
    const setters = [
      (value) => db.prepare("UPDATE appointments SET hora = ? WHERE id = ?").run(value, appointmentId),
      (value) => db.prepare("UPDATE pets SET horario_padrao = ? WHERE id = ?").run(value, petId),
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
        db.prepare("UPDATE appointments SET hora = ? WHERE id = ?").run(parsed.success ? parsed.data : candidate, appointmentId);
      if (parsed.success) assert.doesNotThrow(save, candidate);
      else assert.throws(save, CHECK_FAILED, candidate);
    }
  });

  test("o serviço e a forma de pagamento precisam existir na lista", async () => {
    const { db, petId, appointmentId } = await databaseWithAppointment();

    assert.throws(() => db.prepare("UPDATE appointments SET servico_id = 999 WHERE id = ?").run(appointmentId), FOREIGN_KEY_FAILED);
    assert.throws(
      () => db.prepare("UPDATE appointments SET tipo_pgto_id = 999, tipo_pgto_nome = 'PIX' WHERE id = ?").run(appointmentId),
      FOREIGN_KEY_FAILED,
    );
    assert.throws(() => db.prepare("UPDATE pets SET servico_padrao_id = 999 WHERE id = ?").run(petId), FOREIGN_KEY_FAILED);
    // Gravar pelo nome: o nome fora da lista não acha id, e o NOT NULL recusa.
    assert.throws(() => insertAppointment(db, petId, { servico: "Tosa na máquina" }), /NOT NULL constraint failed/);
    assert.throws(() => insertPet(db, { dono_id: insertOwner(db), servico_padrao: "Spa" }), /NOT NULL constraint failed/);
  });

  test("um serviço ou forma de pagamento em uso não pode ser apagado", async () => {
    const { db, appointmentId } = await databaseWithAppointment();
    saveAppointment(db, appointmentId, { servico: "Banho e Tosa", tipo_pgto: "PIX", ta_pago: 1 });

    assert.throws(() => db.prepare("DELETE FROM service_type WHERE servico = 'Banho e Tosa'").run(), FOREIGN_KEY_FAILED);
    assert.throws(() => db.prepare("DELETE FROM payment_methods WHERE tipo_pgto = 'PIX'").run(), FOREIGN_KEY_FAILED);
  });

  test("a forma de pagamento não se repete na lista", async () => {
    const db = await createDatabase();
    assert.throws(
      () => db.prepare("INSERT INTO payment_methods (tipo_pgto) VALUES ('PIX')").run(),
      /UNIQUE constraint failed/,
    );
  });

  test("os valores fixos do app estão no banco: todo porte passa no CHECK e todo serviço está na lista", async () => {
    const db = await createDatabase();
    const services = db.prepare(LIST_SERVICE_TYPES_SQL).all().map(({ servico }) => servico);
    for (const service of Object.values(TipoServico)) assert.ok(services.includes(service), service);
    const ownerId = insertOwner(db);
    for (const porte of Object.values(PorteAnimal)) insertPet(db, { dono_id: ownerId, porte });
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
    const id = insertAppointment(db, petId, { servico: "Banho e Higiênica", tipo_pgto: "Cartão de Débito" });

    assert.deepEqual(storedNames(db, id), {
      servico_id: idOf(db, "service_type", "servico", "Banho e Higiênica"),
      servico_nome: "Banho e Higiênica",
      tipo_pgto_id: idOf(db, "payment_methods", "tipo_pgto", "Cartão de Débito"),
      tipo_pgto_nome: "Cartão de Débito",
    });
    const shown = db.prepare(FIND_APPOINTMENT_SQL).get(id);
    assert.equal(shown.servico, "Banho e Higiênica");
    assert.equal(shown.tipo_pgto, "Cartão de Débito");
  });

  test("sem forma de pagamento, grava nulo e a tela lê o texto vazio", async () => {
    const { db, appointmentId } = await databaseWithAppointment();

    const stored = storedNames(db, appointmentId);
    assert.deepEqual([stored.tipo_pgto_id, stored.tipo_pgto_nome], [null, null]);
    assert.equal(db.prepare(FIND_APPOINTMENT_SQL).get(appointmentId).tipo_pgto, "");
    assert.equal(db.prepare(LIST_APPOINTMENTS_BETWEEN_SQL).all(isoDate(0), isoDate(9))[0].tipo_pgto, "");
  });

  test("o pet guarda o serviço padrão pelo id, e a remarcação usa o mesmo serviço na agenda", async () => {
    const db = await createDatabase();
    const pet = await createPet(db, {
      dono_id: insertOwner(db), servico_padrao: "Banho e Tosa", remarcacao_ativa: 1, pacote_remarcacao: 4,
      data_inicio_pacote: isoDate(1), valor_pacote: 32000,
    });

    assert.equal(db.prepare(FIND_PET_SQL).get(pet.id).servico_padrao, "Banho e Tosa");
    const agenda = pendingAutoOf(db, pet.id);
    assert.ok(agenda.length > 0);
    assert.ok(agenda.every((a) => a.servico === "Banho e Tosa"));

    const [first] = agenda;
    await packageScheduleOf(db).updateAppointment(first.id, { ...first, concluido: 1, servico: "Banho" });
    assert.equal(pendingAutoOf(db, pet.id).at(-1).servico, "Banho", "o próximo leva o serviço do concluído");
  });

  test("a conferência das listas recusa o que a tela não oferece", async () => {
    const db = await createDatabase();
    const choices = {
      services: db.prepare(LIST_SERVICE_TYPES_SQL).all(),
      paymentMethods: db.prepare(LIST_PAYMENT_METHODS_SQL).all(),
    };
    const notFound = (message) => ({ name: "AppError", code: "NOT_FOUND", message });

    assert.doesNotThrow(() => assertAppointmentChoices({ servico: "Banho", tipo_pgto: "PIX" }, choices));
    assert.doesNotThrow(() => assertAppointmentChoices({ servico: "Banho", tipo_pgto: "" }, choices));
    for (const servico of ["Tosa", "banho", "Banho'; DROP TABLE appointments; --", ""]) {
      assert.throws(
        () => assertAppointmentChoices({ servico, tipo_pgto: "" }, choices),
        notFound(MESSAGES.appointment.serviceNotFound),
        servico,
      );
    }
    for (const tipo_pgto of ["Pix", "Cheque", "0"]) {
      assert.throws(
        () => assertAppointmentChoices({ servico: "Banho", tipo_pgto }, choices),
        notFound(MESSAGES.appointment.paymentMethodNotFound),
        tipo_pgto,
      );
    }
  });
});

describe("o agendamento guarda o nome da época (histórico)", () => {
  test("criar grava o nome do serviço e da forma de pagamento escolhidos", async () => {
    const { db, petId } = await databaseWithAppointment();
    const id = insertAppointment(db, petId, { servico: "Banho e Tosa", tipo_pgto: "Dinheiro" });

    const stored = storedNames(db, id);
    assert.deepEqual([stored.servico_nome, stored.tipo_pgto_nome], ["Banho e Tosa", "Dinheiro"]);
    assert.equal(stored.servico_id, idOf(db, "service_type", "servico", "Banho e Tosa"));
    assert.equal(stored.tipo_pgto_id, idOf(db, "payment_methods", "tipo_pgto", "Dinheiro"));
  });

  test("renomear o serviço ou a forma de pagamento não muda os agendamentos antigos", async () => {
    const { db, petId } = await databaseWithAppointment();
    const old = insertAppointment(db, petId, { servico: "Banho e Tosa", tipo_pgto: "PIX" });
    db.prepare("UPDATE service_type SET servico = 'Banho e Tosa Premium' WHERE servico = 'Banho e Tosa'").run();
    db.prepare("UPDATE payment_methods SET tipo_pgto = 'Pix' WHERE tipo_pgto = 'PIX'").run();

    const shown = db.prepare(FIND_APPOINTMENT_SQL).get(old);
    assert.deepEqual([shown.servico, shown.tipo_pgto], ["Banho e Tosa", "PIX"], "o histórico mostra o nome da época");
    assert.equal(db.prepare(LIST_APPOINTMENTS_BETWEEN_SQL).all(isoDate(0), isoDate(9)).at(-1).servico, "Banho e Tosa");

    // A lista oferece só o nome novo, e o agendamento novo grava o nome novo.
    const services = db.prepare(LIST_SERVICE_TYPES_SQL).all().map(({ servico }) => servico);
    assert.ok(services.includes("Banho e Tosa Premium") && !services.includes("Banho e Tosa"));
    const created = insertAppointment(db, petId, { servico: "Banho e Tosa Premium", tipo_pgto: "Pix" });
    const createdNames = storedNames(db, created);
    assert.deepEqual([createdNames.servico_nome, createdNames.tipo_pgto_nome], ["Banho e Tosa Premium", "Pix"]);
    assert.equal(createdNames.servico_id, storedNames(db, old).servico_id, "o mesmo item da lista");
    assert.throws(() => insertAppointment(db, petId, { servico: "Banho e Tosa" }), /NOT NULL constraint failed/);
  });

  test("editar sem trocar mantém o id e o nome, mesmo depois de renomear; trocar grava o nome novo", async () => {
    const { db, petId } = await databaseWithAppointment();
    const id = insertAppointment(db, petId, { servico: "Banho", tipo_pgto: "PIX" });
    const before = storedNames(db, id);
    db.prepare("UPDATE service_type SET servico = 'Banho completo' WHERE servico = 'Banho'").run();
    db.prepare("UPDATE payment_methods SET tipo_pgto = 'Pix' WHERE tipo_pgto = 'PIX'").run();

    saveAppointment(db, id, { valor: 7000, observacao: "Só mudei o valor" });
    assert.deepEqual(storedNames(db, id), before, "editar outro campo não troca o item");

    saveAppointment(db, id, { servico: "Banho completo", tipo_pgto: "Pix" });
    assert.deepEqual(
      storedNames(db, id),
      { servico_id: before.servico_id, servico_nome: "Banho completo", tipo_pgto_id: before.tipo_pgto_id, tipo_pgto_nome: "Pix" },
      "escolher o nome novo do mesmo item atualiza o nome",
    );

    saveAppointment(db, id, { servico: "Banho e Tosa", tipo_pgto: "Dinheiro" });
    assert.deepEqual(storedNames(db, id), {
      servico_id: idOf(db, "service_type", "servico", "Banho e Tosa"),
      servico_nome: "Banho e Tosa",
      tipo_pgto_id: idOf(db, "payment_methods", "tipo_pgto", "Dinheiro"),
      tipo_pgto_nome: "Dinheiro",
    });

    const chosen = storedNames(db, id);
    assert.throws(() => saveAppointment(db, id, { servico: "Spa" }), /NOT NULL constraint failed/);
    assert.throws(() => saveAppointment(db, id, { tipo_pgto: "Cheque" }), CHECK_FAILED);
    assert.deepEqual(storedNames(db, id), chosen, "a troca recusada não muda nada");
  });

  test("pagamento vazio fica com id e nome nulos", async () => {
    const { db, petId } = await databaseWithAppointment();
    const id = insertAppointment(db, petId, { tipo_pgto: "PIX" });

    saveAppointment(db, id, { tipo_pgto: "" });

    const stored = storedNames(db, id);
    assert.deepEqual([stored.tipo_pgto_id, stored.tipo_pgto_nome], [null, null]);
    assert.equal(db.prepare(FIND_APPOINTMENT_SQL).get(id).tipo_pgto, "");
  });

  test("o CHECK recusa id sem nome, nome sem id e serviço sem nome", async () => {
    const { db, appointmentId } = await databaseWithAppointment();
    const set = (assignments) => () =>
      db.prepare(`UPDATE appointments SET ${assignments} WHERE id = ?`).run(appointmentId);

    assert.throws(set("tipo_pgto_id = 4"), CHECK_FAILED, "id sem nome");
    assert.throws(set("tipo_pgto_nome = 'PIX'"), CHECK_FAILED, "nome sem id");
    for (const blank of ["''", "'   '"]) assert.throws(set(`servico_nome = ${blank}`), CHECK_FAILED, blank);
    assert.throws(set("servico_nome = NULL"), /NOT NULL constraint failed/);

    assert.doesNotThrow(set("tipo_pgto_id = 4, tipo_pgto_nome = 'PIX'"));
    assert.doesNotThrow(set("tipo_pgto_id = NULL, tipo_pgto_nome = NULL"));
  });

  test("concluir um automático cria o próximo com o nome atual do id", async () => {
    const db = await createDatabase();
    const pet = await createPet(db, {
      dono_id: insertOwner(db), servico_padrao: "Banho", remarcacao_ativa: 1, pacote_remarcacao: 4,
      data_inicio_pacote: isoDate(1), valor_pacote: 32000,
    });
    const [first] = pendingAutoOf(db, pet.id);
    assert.equal(first.servico, "Banho");
    db.prepare("UPDATE service_type SET servico = 'Banho completo' WHERE servico = 'Banho'").run();

    await packageScheduleOf(db).updateAppointment(first.id, { ...first, concluido: 1 });

    const next = pendingAutoOf(db, pet.id).at(-1);
    assert.equal(next.servico, "Banho completo", "o próximo é novo, então leva o nome de hoje");
    assert.equal(storedNames(db, next.id).servico_id, storedNames(db, first.id).servico_id);
    assert.equal(db.prepare(FIND_APPOINTMENT_SQL).get(first.id).servico, "Banho", "o concluído guarda o da época");
  });
});

describe("o dinheiro não aceita valor negativo", () => {
  test("o valor do agendamento e o do pacote do pet recusam negativo e aceitam zero (o pacote, também nulo)", async () => {
    const { db, petId, appointmentId } = await databaseWithAppointment();

    for (const invalid of [-1, -1150, -100_000_000]) {
      assert.throws(() => db.prepare("UPDATE appointments SET valor = ? WHERE id = ?").run(invalid, appointmentId), CHECK_FAILED, `valor ${invalid}`);
      assert.throws(() => db.prepare("UPDATE pets SET valor_pacote = ? WHERE id = ?").run(invalid, petId), CHECK_FAILED, `pacote ${invalid}`);
    }
    assert.throws(() => insertAppointment(db, petId, { valor: -1 }), CHECK_FAILED);
    assert.throws(() => insertPet(db, { dono_id: insertOwner(db), valor_pacote: -1 }), CHECK_FAILED);

    db.prepare("UPDATE appointments SET valor = 0 WHERE id = ?").run(appointmentId);
    db.prepare("UPDATE pets SET valor_pacote = 0 WHERE id = ?").run(petId);
    db.prepare("UPDATE pets SET valor_pacote = NULL WHERE id = ?").run(petId);
    assert.throws(() => db.prepare("UPDATE appointments SET valor = NULL WHERE id = ?").run(appointmentId), /NOT NULL constraint failed/);
  });
});

// ── Migração da versão 5 para a 6 ─────────────────────────────────────────

/** O INSERT do agendamento da versão 5, com o serviço e o pagamento pelo nome. */
function insertV5Appointment(db, petId, fields) {
  const a = {
    servico: "Banho", data: isoDate(-3), hora: "10:00", entregar_pet: 0, concluido: 0, is_auto_agen: 0,
    observacao: null, valor: 5000, tipo_pgto: "0", ta_pago: 0, ...fields,
  };
  const result = db
    .prepare(
      `INSERT INTO appointments (pet_id, servico, data, hora, entregar_pet, concluido, is_auto_agen, observacao,
        valor, tipo_pgto, ta_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(petId, a.servico, a.data, a.hora, a.entregar_pet, a.concluido, a.is_auto_agen, a.observacao, a.valor,
      a.tipo_pgto, a.ta_pago);
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
  const ownerId = insertOwner(db, { nome: "Conceição D'Ávila" });
  const inactiveOwner = insertOwner(db, { nome: "Dono com flag 5", telefone: "(44) 90000-0001" });
  db.prepare("UPDATE owners SET is_ativo = 5 WHERE id = ?").run(inactiveOwner);
  db.prepare("UPDATE configs SET is_ativo = 7 WHERE id = 1").run();

  const pets = {
    pacoca: insertPet(db, { dono_id: ownerId, nome: "Paçoca", porte: "Pequeno", servico_padrao: "Banho e Tosa", horario_padrao: "7:05" }),
    mel: insertPet(db, { dono_id: ownerId, nome: "Mel", porte: "Médio", servico_padrao: " Hidratação ", horario_padrao: null }),
    thor: insertPet(db, { dono_id: ownerId, nome: "Thor", porte: "Grandão", servico_padrao: "", horario_padrao: "25:00" }),
    bob: insertPet(db, { dono_id: inactiveOwner, nome: "Bob", porte: "GRANDE", horario_padrao: "14:30" }),
    xis: insertPet(db, { dono_id: ownerId, nome: "Xis", porte: "gigante" }),
  };
  db.prepare("UPDATE pets SET is_ativo = 2, remarcacao_ativa = -1 WHERE id = ?").run(pets.bob.id);

  db.exec("PRAGMA foreign_keys = OFF;");
  const appointments = {
    normal: insertV5Appointment(db, pets.pacoca.id, { tipo_pgto: "PIX", concluido: 1, ta_pago: 1, observacao: "Tem medo de secador 'barulhento'" }),
    spaces: insertV5Appointment(db, pets.mel.id, { servico: " Banho e Tosa ", tipo_pgto: "", hora: "9:30" }),
    unknown: insertV5Appointment(db, pets.mel.id, { servico: "Hidratação", tipo_pgto: "Vale-presente", hora: "24:00" }),
    blank: insertV5Appointment(db, pets.pacoca.id, { servico: "", hora: "abc", entregar_pet: 2, concluido: 3, is_auto_agen: 9, ta_pago: -1 }),
    orphan: insertV5Appointment(db, 999, { servico: "  ", hora: "" }),
  };
  db.exec("PRAGMA foreign_keys = ON;");
  return { db, pets, appointments };
}

const migrate = (db) => migrateDatabase(asMigrationDatabase(db), MIGRATIONS);
const foreignKeyProblems = (db) => db.prepare("SELECT \"table\", rowid FROM pragma_foreign_key_check").all().map((row) => ({ ...row }));

describe("migração para a versão 6", () => {
  test("um banco da versão 5 com dados sobe sem perder nenhum registro, e o esquema fica igual ao novo", async () => {
    const { db } = await v5WithOldData();
    const tables = ["configs", "owners", "pets", "appointments", "service_type", "payment_methods"];
    const idsBefore = Object.fromEntries(tables.map((table) => [table, rows(db, table).map(({ id }) => id)]));
    const sequencesBefore = db.prepare("SELECT name, seq FROM sqlite_sequence ORDER BY name").all();
    const kept = ["id", "pet_id", "data", "valor", "criado_em"];
    const keptOf = (db) => rows(db, "appointments").map((row) => Object.fromEntries(kept.map((c) => [c, row[c]])));
    const appointmentsBefore = keptOf(db);
    const problemsBefore = foreignKeyProblems(db);
    assert.equal(problemsBefore.length, 1, "só o agendamento do pet que não existe");

    assert.equal(await migrate(db), MIGRATIONS.length);

    for (const table of ["configs", "owners", "pets", "appointments"]) {
      assert.deepEqual(rows(db, table).map(({ id }) => id), idsBefore[table], `${table}: os mesmos ids`);
    }
    assert.deepEqual(keptOf(db), appointmentsBefore, "o resto do agendamento não muda");
    assert.deepEqual(
      db.prepare("SELECT name, seq FROM sqlite_sequence WHERE name IN ('configs', 'owners', 'pets', 'appointments') ORDER BY name").all(),
      sequencesBefore.filter(({ name }) => ["configs", "owners", "pets", "appointments"].includes(name)),
      "a contagem de ids continua de onde parou",
    );
    assert.deepEqual(schemaObjects(db), schemaObjects(await createDatabase()));
    assert.deepEqual(foreignKeyProblems(db), problemsBefore, "nenhuma referência quebrada nova");
  });

  test("o nome do serviço e do pagamento vira o id do mesmo nome, e o que não estava na lista entra nela", async () => {
    const { db, pets, appointments } = await v5WithOldData();
    await migrate(db);
    const shown = (id) => db.prepare(FIND_APPOINTMENT_SQL).get(id);

    assert.deepEqual([shown(appointments.normal).servico, shown(appointments.normal).tipo_pgto], ["Banho", "PIX"]);
    assert.deepEqual([shown(appointments.spaces).servico, shown(appointments.spaces).tipo_pgto], ["Banho e Tosa", ""]);
    assert.deepEqual([shown(appointments.unknown).servico, shown(appointments.unknown).tipo_pgto], ["Hidratação", "Vale-presente"]);
    // Sem nome, o agendamento fica com o serviço padrão do pet.
    assert.equal(shown(appointments.blank).servico, "Banho e Tosa");
    assert.equal(shown(appointments.blank).tipo_pgto, "", "o 0 do DEFAULT antigo é a forma não informada");
    const orphan = db.prepare("SELECT servico_id, hora FROM appointments WHERE id = ?").get(appointments.orphan);
    assert.equal(orphan.servico_id, idOf(db, "service_type", "servico", "Banho"), "sem nome e sem pet, o Banho");
    assert.equal(orphan.hora, "00:00");

    const petService = (pet) => db.prepare(FIND_PET_SQL).get(pet.id).servico_padrao;
    assert.equal(petService(pets.pacoca), "Banho e Tosa");
    assert.equal(petService(pets.mel), "Banho", "o serviço padrão fora dos três vira o Banho");
    assert.equal(observationOf(db, "pets", pets.mel.id), 'Serviço padrão antigo: "Hidratação".');
    assert.equal(petService(pets.thor), "Banho", "sem serviço, o Banho do DEFAULT antigo");

    // O que não estava na lista entra nela, mas oculto: o formulário não oferece (ver "itens ocultos").
    const everyService = db.prepare("SELECT servico FROM service_type ORDER BY servico").all().map(({ servico }) => servico);
    assert.deepEqual(everyService, ["Banho", "Banho e Higiênica", "Banho e Tosa", "Hidratação"]);
    const everyMethod = db.prepare("SELECT tipo_pgto FROM payment_methods ORDER BY id").all().map(({ tipo_pgto }) => tipo_pgto);
    assert.deepEqual(everyMethod, ["Cartão de Crédito", "Cartão de Débito", "Dinheiro", "PIX", "Outro", "Vale-presente"]);
    assert.equal(storedNames(db, appointments.unknown).servico_nome, "Hidratação");
    assert.equal(storedNames(db, appointments.unknown).tipo_pgto_nome, "Vale-presente");
    assert.equal(storedNames(db, appointments.blank).servico_nome, "Banho e Tosa");
  });

  test("o porte, os horários e os flags fora do domínio seguem as regras do app", async () => {
    const { db, pets, appointments } = await v5WithOldData();
    await migrate(db);
    const pet = (p) => db.prepare("SELECT porte, horario_padrao, is_ativo, remarcacao_ativa FROM pets WHERE id = ?").get(p.id);
    const appointment = (id) =>
      db.prepare("SELECT hora, entregar_pet, concluido, is_auto_agen, ta_pago FROM appointments WHERE id = ?").get(id);

    assert.deepEqual({ ...pet(pets.pacoca) }, { porte: "PEQUENO", horario_padrao: "07:05", is_ativo: 1, remarcacao_ativa: 0 });
    assert.deepEqual({ ...pet(pets.mel) }, { porte: "MEDIO", horario_padrao: "00:00", is_ativo: 1, remarcacao_ativa: 0 });
    assert.deepEqual({ ...pet(pets.thor) }, { porte: "GRANDAO", horario_padrao: "00:00", is_ativo: 1, remarcacao_ativa: 0 });
    assert.deepEqual({ ...pet(pets.bob) }, { porte: "GRANDE", horario_padrao: "14:30", is_ativo: 1, remarcacao_ativa: 1 });
    assert.equal(pet(pets.xis).porte, "MEDIO", "o porte desconhecido fica com o padrão do formulário");

    assert.equal(appointment(appointments.normal).hora, "10:00");
    assert.equal(appointment(appointments.spaces).hora, "09:30");
    assert.equal(appointment(appointments.unknown).hora, "00:00");
    assert.deepEqual(
      { ...appointment(appointments.blank) },
      { hora: "00:00", entregar_pet: 1, concluido: 1, is_auto_agen: 1, ta_pago: 1 },
    );
    assert.equal(db.prepare("SELECT is_ativo FROM owners WHERE nome = 'Dono com flag 5'").get().is_ativo, 1);
    assert.equal(db.prepare("SELECT is_ativo FROM configs WHERE id = 1").get().is_ativo, 1);
  });

  test("a lista de pagamento com os ids da carga de maio de 2026 e um nome repetido continua certa", async () => {
    const db = await databaseAt(5);
    // A carga de maio tinha o PIX no 3 e o Dinheiro no 4, e o INSERT OR IGNORE da versão 1 não trocou.
    db.exec(`
      UPDATE payment_methods SET tipo_pgto = 'PIX' WHERE id = 3;
      UPDATE payment_methods SET tipo_pgto = 'Dinheiro' WHERE id = 4;
      INSERT INTO payment_methods (tipo_pgto) VALUES ('PIX');
    `);
    const pet = insertPet(db, { dono_id: insertOwner(db) });
    const pix = insertV5Appointment(db, pet.id, { tipo_pgto: "PIX" });
    const cash = insertV5Appointment(db, pet.id, { tipo_pgto: "Dinheiro" });

    await migrate(db);

    assert.equal(db.prepare("SELECT tipo_pgto_id FROM appointments WHERE id = ?").get(pix).tipo_pgto_id, 3);
    assert.equal(db.prepare(FIND_APPOINTMENT_SQL).get(pix).tipo_pgto, "PIX");
    assert.equal(db.prepare(FIND_APPOINTMENT_SQL).get(cash).tipo_pgto, "Dinheiro");
    assert.equal(db.prepare("SELECT COUNT(*) AS total FROM payment_methods WHERE tipo_pgto = 'PIX'").get().total, 1);
  });

  test("depois da migração, o dado antigo pode ser editado e concluído pelo app", async () => {
    const { db, appointments } = await v5WithOldData();
    await migrate(db);
    const old = db.prepare(FIND_APPOINTMENT_SQL).get(appointments.unknown);

    await packageScheduleOf(db).updateAppointment(old.id, { ...old, concluido: 1, ta_pago: 1 });

    const saved = db.prepare(FIND_APPOINTMENT_SQL).get(old.id);
    assert.deepEqual([saved.servico, saved.tipo_pgto, saved.concluido], ["Hidratação", "Vale-presente", 1]);
  });
});

// ── Itens ocultos, serviços padrão e notas da migração ────────────────────

const notFoundError = (message) => ({ name: "AppError", code: "NOT_FOUND", message });
const namesOf = (db, sql, column) => db.prepare(sql).all().map((row) => row[column]);
const OBSERVATION_COLUMN = { pets: "observacoes", appointments: "observacao" };
const observationOf = (db, table, id) =>
  db.prepare(`SELECT ${OBSERVATION_COLUMN[table]} AS text FROM ${table} WHERE id = ?`).get(id).text;

describe("itens ocultos da migração", () => {
  test("as listas do formulário não trazem os ocultos, e o histórico mostra o nome", async () => {
    const { db, appointments } = await v5WithOldData();
    await migrate(db);

    assert.deepEqual(namesOf(db, LIST_SERVICE_TYPES_SQL, "servico"), ["Banho", "Banho e Higiênica", "Banho e Tosa"]);
    assert.deepEqual(
      namesOf(db, LIST_PAYMENT_METHODS_SQL, "tipo_pgto"),
      ["Cartão de Crédito", "Cartão de Débito", "Dinheiro", "PIX", "Outro"],
    );
    assert.deepEqual(namesOf(db, "SELECT servico FROM service_type WHERE is_ativo = 0", "servico"), ["Hidratação"]);
    assert.deepEqual(namesOf(db, "SELECT tipo_pgto FROM payment_methods WHERE is_ativo = 0", "tipo_pgto"), ["Vale-presente"]);

    const shown = db.prepare(FIND_APPOINTMENT_SQL).get(appointments.unknown);
    assert.deepEqual([shown.servico, shown.tipo_pgto], ["Hidratação", "Vale-presente"]);
    const inRange = db.prepare(LIST_APPOINTMENTS_BETWEEN_SQL).all(isoDate(-4), isoDate(-2));
    assert.ok(inRange.some((a) => a.servico === "Hidratação" && a.tipo_pgto === "Vale-presente"));
  });

  test("o item que já estava na lista continua ativo", async () => {
    const { db } = await v5WithOldData();
    await migrate(db);

    assert.deepEqual(
      namesOf(db, "SELECT servico FROM service_type WHERE is_ativo = 1 ORDER BY id", "servico"),
      ["Banho", "Banho e Tosa", "Banho e Higiênica"],
    );
    assert.equal(db.prepare("SELECT COUNT(*) AS total FROM payment_methods WHERE is_ativo = 1").get().total, 5);
  });

  test("a conferência aceita o oculto igual ao gravado e recusa o oculto na criação e na troca", async () => {
    const { db } = await v5WithOldData();
    await migrate(db);
    const choices = {
      services: db.prepare(LIST_SERVICE_TYPES_SQL).all(),
      paymentMethods: db.prepare(LIST_PAYMENT_METHODS_SQL).all(),
    };
    const hidden = { servico: "Hidratação", tipo_pgto: "Vale-presente" };
    const regular = { servico: "Banho", tipo_pgto: "PIX" };
    const serviceNotFound = notFoundError(MESSAGES.appointment.serviceNotFound);
    const paymentNotFound = notFoundError(MESSAGES.appointment.paymentMethodNotFound);

    // Editar o que está gravado, sem trocar o serviço nem a forma de pagamento.
    assert.doesNotThrow(() => assertAppointmentChoices(hidden, choices, hidden));
    assert.doesNotThrow(() => assertAppointmentChoices({ ...hidden, tipo_pgto: "PIX" }, choices, hidden), "trocou só o pagamento");
    assert.doesNotThrow(() => assertAppointmentChoices({ ...hidden, servico: "Banho" }, choices, hidden), "trocou só o serviço");
    // Criar: só item ativo.
    assert.throws(() => assertAppointmentChoices(hidden, choices), serviceNotFound);
    assert.throws(() => assertAppointmentChoices({ servico: "Banho", tipo_pgto: "Vale-presente" }, choices), paymentNotFound);
    // Trocar o gravado por um oculto: recusado.
    assert.throws(() => assertAppointmentChoices({ ...regular, servico: "Hidratação" }, choices, regular), serviceNotFound);
    assert.throws(() => assertAppointmentChoices({ ...regular, tipo_pgto: "Vale-presente" }, choices, regular), paymentNotFound);
    // O oculto de outro agendamento não vale: só o gravado neste.
    assert.throws(() => assertAppointmentChoices(hidden, choices, { servico: "Hidratação", tipo_pgto: "" }), paymentNotFound);
  });

  test("gravar com um nome oculto é recusado, e is_ativo só aceita 0 ou 1", async () => {
    const { db, pets } = await v5WithOldData();
    await migrate(db);

    assert.throws(() => insertAppointment(db, pets.pacoca.id, { servico: "Hidratação" }), /NOT NULL constraint failed: appointments.servico_id/);
    assert.throws(() => insertAppointment(db, pets.pacoca.id, { tipo_pgto: "Vale-presente" }), CHECK_FAILED);
    for (const table of ["service_type", "payment_methods"]) {
      for (const invalid of [2, -1, "sim", null]) {
        assert.throws(() => db.prepare(`UPDATE ${table} SET is_ativo = ? WHERE id = 1`).run(invalid), invalid === null ? /NOT NULL/ : CHECK_FAILED, `${table} ${invalid}`);
      }
    }
  });

  test("editar o agendamento com item oculto, sem trocá-lo, funciona e mantém o id, mesmo renomeado", async () => {
    const { db, appointments } = await v5WithOldData();
    await migrate(db);
    const before = storedNames(db, appointments.unknown);
    db.prepare("UPDATE service_type SET servico = 'Hidratação premium' WHERE servico = 'Hidratação'").run();

    saveAppointment(db, appointments.unknown, { observacao: "Editei", concluido: 1, ta_pago: 1 });

    assert.deepEqual(storedNames(db, appointments.unknown), before);
    const saved = db.prepare(FIND_APPOINTMENT_SQL).get(appointments.unknown);
    assert.deepEqual([saved.servico, saved.tipo_pgto, saved.concluido, saved.observacao], ["Hidratação", "Vale-presente", 1, "Editei"]);
    // Trocar para um item ativo funciona; voltar ao oculto, não.
    saveAppointment(db, appointments.unknown, { servico: "Banho", tipo_pgto: "PIX" });
    assert.throws(() => saveAppointment(db, appointments.unknown, { servico: "Hidratação premium" }), /NOT NULL constraint failed/);
  });
});

describe("serviços padrão garantidos pela migração", () => {
  test("uma versão 5 sem o Banho recebe o Banho ativo, mesmo com ele só no texto dos agendamentos", async () => {
    const db = await databaseAt(5);
    db.prepare("DELETE FROM service_type WHERE servico = 'Banho'").run();
    const ownerId = insertOwner(db);
    const withoutService = insertPet(db, { dono_id: ownerId, nome: "Sem serviço", servico_padrao: "" });
    const onlyInText = insertV5Appointment(db, withoutService.id, { servico: "Banho" });
    db.exec("PRAGMA foreign_keys = OFF;");
    const orphan = insertV5Appointment(db, 999, { servico: "" });
    db.exec("PRAGMA foreign_keys = ON;");

    await migrate(db);

    const banho = db.prepare("SELECT id, is_ativo FROM service_type WHERE servico = 'Banho'").all();
    assert.equal(banho.length, 1);
    assert.equal(banho[0].is_ativo, 1, "ativo, e não oculto como um nome desconhecido");
    assert.equal(petRow(db, withoutService.id).servico_padrao_id, banho[0].id);
    for (const id of [onlyInText, orphan]) {
      assert.deepEqual(
        { ...db.prepare("SELECT servico_id, servico_nome FROM appointments WHERE id = ?").get(id) },
        { servico_id: banho[0].id, servico_nome: "Banho" },
      );
    }
    assert.ok(namesOf(db, LIST_SERVICE_TYPES_SQL, "servico").includes("Banho"));
    assert.equal(foreignKeyProblems(db).length, 1, "só o agendamento do pet que não existe, que já era assim");
  });

  test("os três serviços do formulário do pet ficam ativos, e um banco novo não fica com repetidos", async () => {
    const db = await databaseAt(5);
    db.prepare("DELETE FROM service_type WHERE servico IN ('Banho e Tosa', 'Banho e Higiênica')").run();
    await migrate(db);
    const fresh = await createDatabase();

    for (const database of [db, fresh]) {
      assert.deepEqual(
        namesOf(database, "SELECT servico FROM service_type WHERE is_ativo = 1 ORDER BY servico", "servico"),
        [...Object.values(TipoServico)].sort(),
      );
      assert.equal(database.prepare("SELECT COUNT(*) AS total FROM service_type").get().total, 3);
    }
  });
});

describe("notas da migração com o valor antigo", () => {
  /** Um banco da versão 5 com valores que a conversão joga fora, e valores que ela só normaliza. */
  async function v5WithLostValues() {
    const db = await databaseAt(5);
    const dono_id = insertOwner(db);
    const pets = {
      allThree: insertPet(db, { dono_id, nome: "Xyz", porte: "xyz", servico_padrao: "Hidratação", observacoes: "Alérgico a xampu forte", horario_padrao: "25:00", valor_pacote: -1150 }),
      onlyPorte: insertPet(db, { dono_id, nome: "Abc", porte: "abc", observacoes: null }),
      cents: insertPet(db, { dono_id, nome: "Centavos", observacoes: "Dócil", valor_pacote: -50 }),
      longPorte: insertPet(db, { dono_id, nome: "Longo", porte: "x".repeat(60) }),
      normalized: insertPet(db, { dono_id, nome: "Normal", porte: "Médio", observacoes: "Sem nota", horario_padrao: "9:30" }),
      empty: insertPet(db, { dono_id, nome: "Vazio", porte: "", observacoes: null, horario_padrao: null }),
    };
    const appointments = {
      badTime: insertV5Appointment(db, pets.allThree.id, { hora: "abc", observacao: "Tem medo de secador" }),
      badTimeNoText: insertV5Appointment(db, pets.allThree.id, { hora: "25:00" }),
      negative: insertV5Appointment(db, pets.allThree.id, { hora: "9:30", valor: -1150 }),
      cents: insertV5Appointment(db, pets.allThree.id, { valor: -50, observacao: "Pagou fiado" }),
      both: insertV5Appointment(db, pets.allThree.id, { hora: "abc", valor: -1150 }),
      normalized: insertV5Appointment(db, pets.allThree.id, { hora: "9:30", observacao: "Sem nota" }),
      emptyTime: insertV5Appointment(db, pets.allThree.id, { hora: "" }),
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
      { ...db.prepare("SELECT porte, horario_padrao, valor_pacote FROM pets WHERE id = ?").get(pets.allThree.id) },
      { porte: "MEDIO", horario_padrao: "00:00", valor_pacote: 0 },
    );
    assert.equal(db.prepare(FIND_PET_SQL).get(pets.allThree.id).servico_padrao, "Banho");
    assert.equal(
      db.prepare("SELECT COUNT(*) AS total FROM service_type WHERE servico = 'Hidratação'").get().total,
      0,
      "nenhum agendamento usa o serviço, então ele não fica na lista nem oculto",
    );

    assert.equal(appointmentNote(appointments.badTime), 'Tem medo de secador\nHorário antigo: "abc".');
    assert.equal(appointmentNote(appointments.badTimeNoText), 'Horário antigo: "25:00".');
    assert.equal(appointmentNote(appointments.negative), 'Valor antigo: "-11,50".');
    assert.equal(appointmentNote(appointments.cents), 'Pagou fiado\nValor antigo: "-0,50".');
    assert.equal(appointmentNote(appointments.both), 'Horário antigo: "abc". Valor antigo: "-11,50".');
    assert.deepEqual(
      { ...db.prepare("SELECT hora, valor FROM appointments WHERE id = ?").get(appointments.negative) },
      { hora: "09:30", valor: 0 },
      "o horário recuperável é normalizado, e o negativo vira 0",
    );
  });

  test("a normalização e o nulo ou vazio não ganham nota", async () => {
    const { db, pets, appointments } = await v5WithLostValues();
    await migrate(db);

    assert.equal(observationOf(db, "pets", pets.normalized.id), "Sem nota");
    assert.deepEqual(
      { ...db.prepare("SELECT porte, horario_padrao FROM pets WHERE id = ?").get(pets.normalized.id) },
      { porte: "MEDIO", horario_padrao: "09:30" },
    );
    assert.equal(observationOf(db, "pets", pets.empty.id), null, "porte vazio e horário nulo");
    assert.deepEqual(
      { ...db.prepare("SELECT porte, horario_padrao FROM pets WHERE id = ?").get(pets.empty.id) },
      { porte: "MEDIO", horario_padrao: "00:00" },
    );
    assert.equal(observationOf(db, "appointments", appointments.normalized), "Sem nota");
    assert.equal(observationOf(db, "appointments", appointments.emptyTime), null);
  });

  test("um pacote negativo da versão 5 vira 0, e a agenda que ele gera sai com 0", async () => {
    const db = await databaseAt(5);
    const pet = insertPet(db, {
      dono_id: insertOwner(db), remarcacao_ativa: 1, pacote_remarcacao: 4, data_inicio_pacote: isoDate(1),
      valor_pacote: -32000, horario_padrao: "10:00",
    });
    await migrate(db);
    assert.equal(petRow(db, pet.id).valor_pacote, 0);

    // Salvar o pet com outro horário refaz a agenda a partir do valor do pacote.
    await savePet(db, { ...petRow(db, pet.id), servico_padrao: "Banho", horario_padrao: "11:00" });

    const agenda = pendingAutoOf(db, pet.id);
    assert.ok(agenda.length > 0);
    assert.ok(agenda.every((a) => a.valor === 0), "nenhum automático com valor negativo");
    assert.equal(appointmentsOf(db, pet.id).length, agenda.length);
  });
});

describe("limites de tamanho só no que mudou", () => {
  const tooLong = (field, max) => ({ name: "AppError", code: "VALIDATION", message: MESSAGES.textTooLong(field, max) });

  /** Um banco da versão 5 já migrado, com texto grande que a migração engorda ou deixa oculto. */
  async function migratedWithLongTexts() {
    const db = await databaseAt(5);
    const dono_id = insertOwner(db);
    const pet = insertPet(db, { dono_id, nome: "Textão", porte: "xyz", observacoes: "o".repeat(240) });
    const longService = "S".repeat(60);
    const longPayment = "P".repeat(60);
    const appointment = insertV5Appointment(db, pet.id, {
      servico: longService, tipo_pgto: longPayment, hora: "abc", observacao: "a".repeat(240),
    });
    await migrate(db);
    return { db, pet, appointment, longService, longPayment };
  }

  test("a observação do agendamento com a nota passa de 250 e salva sem mudar, mas não cresce", async () => {
    const { db, appointment } = await migratedWithLongTexts();
    const stored = db.prepare(FIND_APPOINTMENT_SQL).get(appointment).observacao;
    assert.ok(stored.length > MAX_NOTES_LENGTH, "a nota empurrou a observação para além do limite");

    await editAppointmentLikeTheApp(db, appointment, { ta_pago: 1 });
    assert.equal(db.prepare(FIND_APPOINTMENT_SQL).get(appointment).observacao, stored);

    const error = tooLong("A observação do agendamento", MAX_NOTES_LENGTH);
    await assert.rejects(editAppointmentLikeTheApp(db, appointment, { observacao: `${stored}x` }), error);
    await assert.rejects(editAppointmentLikeTheApp(db, appointment, { observacao: "b".repeat(MAX_NOTES_LENGTH + 1) }), error);
    // Encurtar até o limite volta a valer.
    await editAppointmentLikeTheApp(db, appointment, { observacao: "b".repeat(MAX_NOTES_LENGTH) });
    assert.equal(db.prepare(FIND_APPOINTMENT_SQL).get(appointment).observacao.length, MAX_NOTES_LENGTH);
  });

  test("a observação do pet com a nota passa de 250 e salva sem mudar, mas não cresce", async () => {
    const { db, pet } = await migratedWithLongTexts();
    const stored = db.prepare(FIND_PET_SQL).get(pet.id).observacoes;
    assert.ok(stored.length > MAX_NOTES_LENGTH);

    await editPetLikeTheApp(db, pet.id, { nome: "Textão 2" });
    const saved = db.prepare(FIND_PET_SQL).get(pet.id);
    assert.deepEqual([saved.nome, saved.observacoes], ["Textão 2", stored]);

    await assert.rejects(
      editPetLikeTheApp(db, pet.id, { observacoes: `${stored}x` }),
      tooLong("A observação do pet", MAX_NOTES_LENGTH),
    );
  });

  test("o nome oculto de 60 caracteres passa sem trocar e é recusado na criação e na troca", async () => {
    const { db, pet, appointment, longService, longPayment } = await migratedWithLongTexts();

    await editAppointmentLikeTheApp(db, appointment, { valor: 7000 });
    const saved = db.prepare(FIND_APPOINTMENT_SQL).get(appointment);
    assert.deepEqual([saved.servico, saved.tipo_pgto, saved.valor], [longService, longPayment, 7000]);

    const input = { ...saved, pet_id: pet.id, observacao: null };
    assert.throws(() => parseInput(appointmentSchema, input), tooLong("O serviço", MAX_LIST_ITEM_LENGTH));
    assert.throws(
      () => parseInput(appointmentSchema, { ...input, servico: "Banho" }),
      tooLong("O tipo de pagamento", MAX_LIST_ITEM_LENGTH),
    );
    await assert.rejects(
      editAppointmentLikeTheApp(db, appointment, { servico: "T".repeat(60) }),
      tooLong("O serviço", MAX_LIST_ITEM_LENGTH),
    );
  });

  test("o teto alto vale mesmo para o texto igual ao gravado", () => {
    const huge = "x".repeat(MAX_STORED_TEXT_LENGTH + 1);
    const schema = appointmentSchemaFor({ servico: huge, tipo_pgto: "", observacao: huge });
    const input = {
      pet_id: 1, servico: "Banho", data: isoDate(1), hora: "10:00", valor: 0, tipo_pgto: "", observacao: huge,
      entregar_pet: 0, concluido: 0, is_auto_agen: 0, ta_pago: 0,
    };

    assert.throws(() => parseInput(schema, input), tooLong("A observação do agendamento", MAX_NOTES_LENGTH));
    assert.throws(() => parseInput(schema, { ...input, observacao: null, servico: huge }), tooLong("O serviço", MAX_LIST_ITEM_LENGTH));
  });
});

describe("a edição do agendamento confere as listas com o que está gravado (service)", () => {
  test("sem agendamento gravado, nada vale além da lista ativa", () => {
    assert.equal(storedChoicesOf(null), undefined);
    assert.equal(storedChoicesOf(undefined), undefined);
    assert.deepEqual(
      storedChoicesOf({ id: 3, servico: "Hidratação", tipo_pgto: "", observacao: "x" }),
      { servico: "Hidratação", tipo_pgto: "" },
      "só os nomes gravados vão para a conferência",
    );
  });

  test("editar o agendamento oculto sem trocar passa; trocar para outro oculto ou criar com o oculto, não", async () => {
    const { db, pets, appointments } = await v5WithOldData();
    await migrate(db);
    const before = storedNames(db, appointments.unknown);

    await editAppointmentLikeTheApp(db, appointments.unknown, { observacao: "Editei", ta_pago: 1 });
    assert.deepEqual(storedNames(db, appointments.unknown), before);
    assert.equal(db.prepare(FIND_APPOINTMENT_SQL).get(appointments.unknown).observacao, "Editei");

    // Outro agendamento, que não tem o oculto gravado, não pode escolher o oculto.
    const regular = insertAppointment(db, pets.pacoca.id, { servico: "Banho", tipo_pgto: "PIX" });
    await assert.rejects(editAppointmentLikeTheApp(db, regular, { servico: "Hidratação" }), {
      code: "NOT_FOUND", message: MESSAGES.appointment.serviceNotFound,
    });
    await assert.rejects(editAppointmentLikeTheApp(db, regular, { tipo_pgto: "Vale-presente" }), {
      code: "NOT_FOUND", message: MESSAGES.appointment.paymentMethodNotFound,
    });
    // O que está gravado vale só para o próprio agendamento: trocar o serviço do oculto por um ativo
    // funciona, e voltar ao oculto não.
    await editAppointmentLikeTheApp(db, appointments.unknown, { servico: "Banho e Tosa" });
    await assert.rejects(editAppointmentLikeTheApp(db, appointments.unknown, { servico: "Hidratação" }), {
      code: "NOT_FOUND", message: MESSAGES.appointment.serviceNotFound,
    });
  });
});
