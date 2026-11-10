// Integridade no próprio banco (DADOS-4, versão 6 do esquema): os CHECKs dos flags, do porte e dos
// horários, o serviço e a forma de pagamento pelo id, com chave estrangeira, e a migração de um banco da
// versão 5 com dado antigo fora do domínio, que precisa subir sem perder nenhum registro.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  asMigrationDatabase,
  createDatabase,
  createPet,
  databaseAt,
  insertOwner,
  insertPet,
  isoDate,
  packageScheduleOf,
  pendingAutoOf,
} from "./helpers/database.mjs";
import { migrateDatabase } from "../src/config/migrator.ts";
import { MIGRATIONS } from "../src/config/schema.ts";
import { PorteAnimal, TipoServico } from "../src/config/petEnums.ts";
import {
  FIND_APPOINTMENT_SQL,
  INSERT_APPOINTMENT_SQL,
  LIST_APPOINTMENTS_BETWEEN_SQL,
  UPDATE_APPOINTMENT_SQL,
} from "../src/repository/sql/appointmentsSql.ts";
import { FIND_PET_SQL } from "../src/repository/sql/petsSql.ts";
import { LIST_PAYMENT_METHODS_SQL, LIST_SERVICE_TYPES_SQL } from "../src/repository/sql/listsSql.ts";
import { assertAppointmentChoices } from "../src/service/appointmentRules.ts";
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

/** Os parâmetros do INSERT_APPOINTMENT_SQL, na ordem, com o serviço e o pagamento pelo nome. */
function insertAppointment(db, petId, fields = {}) {
  const a = {
    servico: "Banho", data: isoDate(2), hora: "10:00", entregar_pet: 0, observacao: null,
    valor: 6000, tipo_pgto: "", ta_pago: 0, ...fields,
  };
  const result = db
    .prepare(INSERT_APPOINTMENT_SQL)
    .run(petId, a.servico, a.data, a.hora, a.entregar_pet, 0, a.observacao, 0, a.valor, a.tipo_pgto, a.ta_pago);
  return Number(result.lastInsertRowid);
}

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
    assert.throws(() => db.prepare("UPDATE appointments SET tipo_pgto_id = 999 WHERE id = ?").run(appointmentId), FOREIGN_KEY_FAILED);
    assert.throws(() => db.prepare("UPDATE pets SET servico_padrao_id = 999 WHERE id = ?").run(petId), FOREIGN_KEY_FAILED);
    // Gravar pelo nome: o nome fora da lista não acha id, e o NOT NULL recusa.
    assert.throws(() => insertAppointment(db, petId, { servico: "Tosa na máquina" }), /NOT NULL constraint failed/);
    assert.throws(() => insertPet(db, { dono_id: insertOwner(db), servico_padrao: "Spa" }), /NOT NULL constraint failed/);
  });

  test("um serviço ou forma de pagamento em uso não pode ser apagado", async () => {
    const { db, appointmentId } = await databaseWithAppointment();
    db.prepare(UPDATE_APPOINTMENT_SQL).run(1, "Banho e Tosa", isoDate(2), "10:00", 0, 0, null, 6000, "PIX", 1, appointmentId);

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

    const raw = db.prepare("SELECT servico_id, tipo_pgto_id FROM appointments WHERE id = ?").get(id);
    assert.equal(raw.servico_id, idOf(db, "service_type", "servico", "Banho e Higiênica"));
    assert.equal(raw.tipo_pgto_id, idOf(db, "payment_methods", "tipo_pgto", "Cartão de Débito"));
    const shown = db.prepare(FIND_APPOINTMENT_SQL).get(id);
    assert.equal(shown.servico, "Banho e Higiênica");
    assert.equal(shown.tipo_pgto, "Cartão de Débito");
  });

  test("sem forma de pagamento, grava nulo e a tela lê o texto vazio", async () => {
    const { db, appointmentId } = await databaseWithAppointment();

    assert.equal(db.prepare("SELECT tipo_pgto_id FROM appointments WHERE id = ?").get(appointmentId).tipo_pgto_id, null);
    assert.equal(db.prepare(FIND_APPOINTMENT_SQL).get(appointmentId).tipo_pgto, "");
    assert.equal(db.prepare(LIST_APPOINTMENTS_BETWEEN_SQL).all(isoDate(0), isoDate(9))[0].tipo_pgto, "");
  });

  test("renomear um item da lista muda o nome em todos os agendamentos, que apontam pelo id", async () => {
    const { db, appointmentId } = await databaseWithAppointment();
    db.prepare("UPDATE service_type SET servico = 'Banho completo' WHERE servico = 'Banho'").run();

    assert.equal(db.prepare(FIND_APPOINTMENT_SQL).get(appointmentId).servico, "Banho completo");
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
    const kept = ["id", "pet_id", "data", "observacao", "valor", "criado_em"];
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
    assert.equal(petService(pets.mel), "Hidratação");
    assert.equal(petService(pets.thor), "Banho", "sem serviço, o Banho do DEFAULT antigo");

    const services = db.prepare(LIST_SERVICE_TYPES_SQL).all().map(({ servico }) => servico);
    assert.deepEqual(services, ["Banho", "Banho e Higiênica", "Banho e Tosa", "Hidratação"]);
    const methods = db.prepare(LIST_PAYMENT_METHODS_SQL).all().map(({ tipo_pgto }) => tipo_pgto);
    assert.deepEqual(methods, ["Cartão de Crédito", "Cartão de Débito", "Dinheiro", "PIX", "Outro", "Vale-presente"]);
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
