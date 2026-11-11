// Relatórios: o SQL de src/repository/sql/reportsSql.ts, que o ReportsRepository executa, e a
// montagem das barras de src/utils/reports, que o ReportsService usa. As datas são texto
// "AAAA-MM-DD" (versão 3 do esquema); o "hoje" e os intervalos são parâmetros, então as datas aqui
// podem ser fixas.
import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { createDatabase, insertAppointment as insertAppointmentRow, insertOwner, insertPet, isoDate } from "./helpers/database.mjs";
import { DEACTIVATE_PET_SQL } from "../src/repository/sql/petsSql.ts";
import {
  ACTIVE_PACKAGES_SQL,
  APPOINTMENTS_BY_MONTH_SQL,
  APPOINTMENTS_BY_ORIGIN_SQL,
  COMPLETED_BY_HOUR_SQL,
  COMPLETED_BY_WEEKDAY_SQL,
  ABSENT_PETS_SQL,
  PETS_BY_RESCHEDULE_SQL,
  PETS_IN_PACKAGE_SQL,
} from "../src/repository/sql/reportsSql.ts";
import {
  countsToBars,
  HOUR_BARS,
  ORIGIN_BARS,
  PACKAGE_BARS,
  RESCHEDULE_BARS,
  WEEKDAY_BARS,
} from "../src/utils/reports/charts.ts";
import { lastMonthsRange, nextMonthsRange } from "../src/utils/reports/months.ts";

/** Agendamento de R$ 50,00 no PIX, pelo comando do app. */
function insertAppointment(db, petId, date, { completed = 0, time = "10:00", auto = 0 } = {}) {
  insertAppointmentRow(db, petId, { date, completed, time, is_auto: auto, price: 5000, payment_method: "PIX" });
}

const setPet = (db, id, column, value) =>
  db.prepare(`UPDATE pets SET ${column} = ? WHERE id = ?`).run(value, id);

/** As linhas como objetos simples, para o deepEqual. */
const rowsOf = (db, sql, ...params) => db.prepare(sql).all(...params).map((r) => ({ ...r }));

/** Um pet ativo com pacote, como o cadastro grava. */
const insertPackagePet = (db, ownerId, name, pacote) =>
  insertPet(db, {
    name, owner_id: ownerId, reschedule_active: 1, package_frequency: pacote,
    package_start_date: isoDate(3), package_price: pacote * 8000,
  });

// Um texto que mudaria a consulta se fosse montado no SQL; como parâmetro, é só um valor que não bate.
const INJECTION = "1 OR 1 = 1";

describe("relatórios: montagem das barras", () => {
  test("uma barra por grupo, na ordem pedida, com 0 no grupo sem linha", () => {
    const rows = [{ category: 1, total: 7 }];

    assert.deepEqual(countsToBars(rows, ORIGIN_BARS), [
      { x: "Manual", y: 0 },
      { x: "Automático", y: 7 },
    ]);
  });

  test("sem nenhuma linha, todas as barras aparecem com 0", () => {
    assert.deepEqual(countsToBars([], RESCHEDULE_BARS), [
      { x: "Com remarcação", y: 0 },
      { x: "Sem remarcação", y: 0 },
    ]);
  });

  test("um grupo que não tem barra fica de fora", () => {
    const rows = [{ category: 3, total: 5 }, { category: 2, total: 1 }];

    assert.deepEqual(countsToBars(rows, PACKAGE_BARS).map((bar) => bar.y), [1, 0]);
  });

  test("os dias da semana vão de domingo a sábado, e as horas, de 00h a 23h", () => {
    assert.deepEqual(WEEKDAY_BARS.map(([day, label]) => `${day}:${label}`), [
      "0:Dom", "1:Seg", "2:Ter", "3:Qua", "4:Qui", "5:Sex", "6:Sáb",
    ]);
    assert.equal(HOUR_BARS.length, 24);
    assert.deepEqual(HOUR_BARS[0], [0, "00h"]);
    assert.deepEqual(HOUR_BARS[23], [23, "23h"]);
  });
});

describe("relatórios: meses do comparativo", () => {
  const monthsOf = (range) => range.bars.map(([month]) => month);
  const labelsOf = (range) => range.bars.map(([, label]) => label);

  test("os últimos 12 meses vão do dia 1 do primeiro ao último dia do mês atual", () => {
    const range = lastMonthsRange(new Date(2026, 2, 31), 12); // 31/03/2026

    assert.equal(range.from, "2025-04-01");
    assert.equal(range.to, "2026-03-31");
    assert.equal(range.bars.length, 12);
    assert.deepEqual(range.bars[0], ["2025-04", "Abr/25"]);
    assert.deepEqual(range.bars[11], ["2026-03", "Mar/26"]);
  });

  test("os próximos 12 meses começam hoje e não pulam fevereiro num dia 31", () => {
    const range = nextMonthsRange(new Date(2026, 0, 31), 12); // 31/01/2026

    assert.equal(range.from, "2026-01-31");
    assert.equal(range.to, "2026-12-31");
    assert.deepEqual(monthsOf(range).slice(0, 3), ["2026-01", "2026-02", "2026-03"]);
    assert.deepEqual(labelsOf(range).slice(-1), ["Dez/26"]);
  });

  test("a virada de ano e o fevereiro de ano bissexto", () => {
    assert.deepEqual(monthsOf(lastMonthsRange(new Date(2026, 0, 15), 2)), ["2025-12", "2026-01"]);
    assert.equal(lastMonthsRange(new Date(2024, 1, 10), 1).to, "2024-02-29");
    assert.equal(nextMonthsRange(new Date(2025, 11, 20), 3).to, "2026-02-28");
  });

  test("as contagens do banco caem nos meses certos, com 0 nos vazios", () => {
    const range = lastMonthsRange(new Date(2026, 2, 10), 3); // Jan a Mar/26
    const rows = [{ category: "2026-01", total: 2 }, { category: "2026-03", total: 5 }];

    assert.deepEqual(countsToBars(rows, range.bars), [
      { x: "Jan/26", y: 2 },
      { x: "Fev/26", y: 0 },
      { x: "Mar/26", y: 5 },
    ]);
  });
});

describe("relatório: atendimentos por mês", () => {
  let db;

  beforeEach(async () => {
    db = await createDatabase();
    const petId = insertPet(db, { owner_id: insertOwner(db) }).id;

    insertAppointment(db, petId, "2025-12-31", { completed: 1 }); // antes do intervalo
    insertAppointment(db, petId, "2026-01-01", { completed: 1 }); // primeiro dia do intervalo
    insertAppointment(db, petId, "2026-01-31", { completed: 1 });
    insertAppointment(db, petId, "2026-02-01", { completed: 1 });
    insertAppointment(db, petId, "2026-02-28", { completed: 1 }); // último dia do intervalo
    insertAppointment(db, petId, "2026-02-15"); // pendente
    insertAppointment(db, petId, "2026-03-01", { completed: 1 }); // depois do intervalo
  });

  test("agrupa os concluídos por AAAA-MM, com as duas pontas do intervalo", () => {
    assert.deepEqual(rowsOf(db, APPOINTMENTS_BY_MONTH_SQL, 1, "2026-01-01", "2026-02-28"), [
      { category: "2026-01", total: 2 },
      { category: "2026-02", total: 2 },
    ]);
  });

  test("conta só os pendentes quando pedido", () => {
    assert.deepEqual(rowsOf(db, APPOINTMENTS_BY_MONTH_SQL, 0, "2026-01-01", "2026-12-31"), [
      { category: "2026-02", total: 1 },
    ]);
  });

  test("um valor malicioso no lugar do concluido não traz nenhuma linha", () => {
    assert.deepEqual(rowsOf(db, APPOINTMENTS_BY_MONTH_SQL, INJECTION, "2026-01-01", "2026-12-31"), []);
  });
});

describe("relatório: dias e horários mais movimentados", () => {
  let db;

  beforeEach(async () => {
    db = await createDatabase();
    const petId = insertPet(db, { owner_id: insertOwner(db) }).id;

    insertAppointment(db, petId, "2026-03-01", { completed: 1, time: "09:00" }); // domingo
    insertAppointment(db, petId, "2026-03-02", { completed: 1, time: "09:30" }); // segunda
    insertAppointment(db, petId, "2026-03-09", { completed: 1, time: "14:00" }); // segunda
    insertAppointment(db, petId, "2026-03-07", { completed: 1, time: "00:15" }); // sábado
    insertAppointment(db, petId, "2026-03-03", { time: "09:00" }); // pendente: não conta
  });

  test("conta os concluídos por dia da semana", () => {
    assert.deepEqual(rowsOf(db, COMPLETED_BY_WEEKDAY_SQL), [
      { category: 0, total: 1 },
      { category: 1, total: 2 },
      { category: 6, total: 1 },
    ]);
  });

  test("conta os concluídos pela hora cheia, com a meia-noite como 0", () => {
    assert.deepEqual(rowsOf(db, COMPLETED_BY_HOUR_SQL), [
      { category: 0, total: 1 },
      { category: 9, total: 2 },
      { category: 14, total: 1 },
    ]);
  });

  test("as barras mostram os sete dias e as 24 horas", () => {
    const days = countsToBars(rowsOf(db, COMPLETED_BY_WEEKDAY_SQL), WEEKDAY_BARS);
    const hours = countsToBars(rowsOf(db, COMPLETED_BY_HOUR_SQL), HOUR_BARS);

    assert.deepEqual(days.map((bar) => bar.y), [1, 2, 0, 0, 0, 0, 1]);
    assert.equal(hours.length, 24);
    assert.deepEqual(hours[9], { x: "09h", y: 2 });
  });
});

describe("relatório: origem dos agendamentos", () => {
  let db;

  beforeEach(async () => {
    db = await createDatabase();
    const petId = insertPet(db, { owner_id: insertOwner(db) }).id;

    insertAppointment(db, petId, "2026-03-01", { completed: 1 });
    insertAppointment(db, petId, "2026-03-02", { completed: 1, auto: 1 });
    insertAppointment(db, petId, "2026-03-03", { completed: 1, auto: 1 });
    insertAppointment(db, petId, "2026-03-04"); // pendente manual
  });

  test("separa manuais e automáticos, concluídos ou pendentes", () => {
    assert.deepEqual(countsToBars(rowsOf(db, APPOINTMENTS_BY_ORIGIN_SQL, 1), ORIGIN_BARS), [
      { x: "Manual", y: 1 },
      { x: "Automático", y: 2 },
    ]);
    assert.deepEqual(countsToBars(rowsOf(db, APPOINTMENTS_BY_ORIGIN_SQL, 0), ORIGIN_BARS), [
      { x: "Manual", y: 1 },
      { x: "Automático", y: 0 },
    ]);
  });

  test("um valor malicioso no lugar do concluido não traz nenhuma linha", () => {
    assert.deepEqual(rowsOf(db, APPOINTMENTS_BY_ORIGIN_SQL, INJECTION), []);
  });
});

describe("relatório: remarcações e pacotes", () => {
  let db;
  let ownerId;

  beforeEach(async () => {
    db = await createDatabase();
    ownerId = insertOwner(db, { name: "José D'Ávila" });
  });

  test("conta os pets ativos com e sem remarcação, sem os inativos", () => {
    insertPackagePet(db, ownerId, "Thor", 4);
    insertPet(db, { name: "Mel", owner_id: ownerId });
    const inactive = insertPet(db, { name: "Bob", owner_id: ownerId });
    db.prepare(DEACTIVATE_PET_SQL).run(inactive.id);

    assert.deepEqual(countsToBars(rowsOf(db, PETS_BY_RESCHEDULE_SQL), RESCHEDULE_BARS), [
      { x: "Com remarcação", y: 1 },
      { x: "Sem remarcação", y: 1 },
    ]);
  });

  test("conta os pets ativos em cada pacote, sem os inativos", () => {
    insertPackagePet(db, ownerId, "Thor", 4);
    insertPackagePet(db, ownerId, "Luna", 2);
    insertPackagePet(db, ownerId, "Nina", 2);
    const inactive = insertPackagePet(db, ownerId, "Bob", 4);
    db.prepare(DEACTIVATE_PET_SQL).run(inactive.id);

    assert.deepEqual(countsToBars(rowsOf(db, ACTIVE_PACKAGES_SQL), PACKAGE_BARS), [
      { x: "Quinzenal\n(2x/mês)", y: 2 },
      { x: "Semanal\n(4x/mês)", y: 1 },
    ]);
  });

  test("lista só os nomes dos pets ativos do pacote pedido, em ordem alfabética", () => {
    insertPackagePet(db, ownerId, "Pé-de-Moça", 2);
    insertPackagePet(db, ownerId, "Luna", 2);
    insertPackagePet(db, ownerId, "Thor", 4);
    const inactive = insertPackagePet(db, ownerId, "Bob", 2);
    db.prepare(DEACTIVATE_PET_SQL).run(inactive.id);
    insertPet(db, { name: "Mel", owner_id: ownerId }); // sem pacote

    assert.deepEqual(rowsOf(db, PETS_IN_PACKAGE_SQL, 2), [{ name: "Luna" }, { name: "Pé-de-Moça" }]);
    assert.deepEqual(rowsOf(db, PETS_IN_PACKAGE_SQL, 4), [{ name: "Thor" }]);
  });

  test("um pacote malicioso não lista nenhum pet", () => {
    insertPackagePet(db, ownerId, "Luna", 2);

    assert.deepEqual(rowsOf(db, PETS_IN_PACKAGE_SQL, "2 OR 1 = 1"), []);
  });
});

describe("relatório: pets ausentes", () => {
  const TODAY = "2026-11-08";
  let db;
  let ownerId;

  beforeEach(async () => {
    db = await createDatabase();
    ownerId = insertOwner(db, { name: "Ana" });
  });

  const absent = (rescheduleActive, limit = 30) => rowsOf(db, ABSENT_PETS_SQL, TODAY, rescheduleActive, limit);

  test("conta os dias desde a última visita e, para quem nunca veio, desde o cadastro", () => {
    const visited = insertPet(db, { name: "Rex", owner_id: ownerId });
    setPet(db, visited.id, "last_visit_date", "2026-10-29");
    const neverCame = insertPet(db, { name: "Mel", owner_id: ownerId });
    setPet(db, neverCame.id, "created_at", "2026-11-01");

    // Quem nunca veio (última visita nula) vem primeiro, como no relatório de antes.
    assert.deepEqual(absent(0), [
      { label: "Mel · Ana", days_absent: 7 },
      { label: "Rex · Ana", days_absent: 10 },
    ]);
  });

  test("o rótulo corta o nome do pet em 10 letras e o do dono em 8", () => {
    const owner = insertOwner(db, { name: "Maria Aparecida" });
    insertPet(db, { name: "Pé-de-Moça Feliz", owner_id: owner });

    assert.equal(absent(0)[0].label, "Pé-de-Moça · Maria Ap");
  });

  test("a virada de mês e de ano conta os dias do calendário", () => {
    const pet = insertPet(db, { owner_id: ownerId });
    setPet(db, pet.id, "last_visit_date", "2025-11-08");

    assert.equal(absent(0)[0].days_absent, 365);
  });

  test("uma visita marcada no futuro não dá dias negativos", () => {
    const pet = insertPet(db, { owner_id: ownerId });
    setPet(db, pet.id, "last_visit_date", "2026-11-20");

    assert.equal(absent(0)[0].days_absent, 0);
  });

  test("separa os pets com e sem remarcação, ignora os inativos e respeita o limite", () => {
    insertPackagePet(db, ownerId, "Thor", 4);
    const inactive = insertPet(db, { name: "Bob", owner_id: ownerId });
    db.prepare(DEACTIVATE_PET_SQL).run(inactive.id);
    insertPet(db, { name: "Mel", owner_id: ownerId });
    insertPet(db, { name: "Nina", owner_id: ownerId });

    assert.deepEqual(absent(1).map((r) => r.label), ["Thor · Ana"]);
    assert.equal(absent(0).length, 2);
    assert.equal(absent(0, 1).length, 1);
  });

  test("devolve só o rótulo e os dias: o telefone e o id do dono não saem do banco", () => {
    insertPet(db, { name: "Rex", owner_id: ownerId });

    assert.deepEqual(Object.keys(absent(0)[0]), ["label", "days_absent"]);
  });
});
