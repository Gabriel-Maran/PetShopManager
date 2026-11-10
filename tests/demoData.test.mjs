// Roda o esquema real do app e os dados de exemplo num SQLite em memória (node:sqlite), com os
// triggers ligados e a agenda dos pacotes pela regra da remarcação, e confere o que as telas e os
// relatórios vão mostrar. Nada é gravado em disco.
//
// Os triggers comparam datas com o relógio do SQLite ('now'), que não dá para fixar. Por isso o
// "hoje" dos dados é o dia de verdade, e as checagens valem para qualquer data.
import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { appointmentsOf, createDatabase, isoDate, petRow } from "./helpers/database.mjs";
import {
  buildDemoDataSql,
  COUNT_USER_DATA_SQL,
  DEMO_DATA_SUMMARY,
} from "../src/config/demoData.ts";
import { normalizeForSearch } from "../src/utils/formatadores/normalizaNome.ts";
import { packagePlanOf, scheduleClockOf, scheduleForNewPet } from "../src/domain/packageSchedule.ts";
import { FIND_PET_SQL } from "../src/repository/sql/petsSql.ts";

const today = new Date();
const todayDate = `'${isoDate(0)}'`;

/** Carrega os dados de exemplo numa transação, como o DemoDataService faz. */
function loadDemoData(db) {
  db.exec("BEGIN");
  db.exec(buildDemoDataSql({ today, normalize: normalizeForSearch }));
  db.exec("COMMIT");
}

const count = (db, sql) => db.prepare(sql).get().total;

describe("dados de exemplo", () => {
  let db;

  beforeEach(async () => {
    db = await createDatabase();
  });

  test("o app novo começa vazio, e depois dos dados deixa de estar", () => {
    assert.equal(count(db, COUNT_USER_DATA_SQL), 0);

    loadDemoData(db);

    assert.ok(count(db, COUNT_USER_DATA_SQL) > 0);
  });

  test("cria os donos e pets do resumo, sem quebrar nenhuma chave estrangeira", () => {
    loadDemoData(db);

    assert.equal(count(db, "SELECT COUNT(*) AS total FROM owners"), DEMO_DATA_SUMMARY.owners);
    assert.equal(count(db, "SELECT COUNT(*) AS total FROM pets"), DEMO_DATA_SUMMARY.pets);
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  });

  test("os nomes ficam normalizados para a busca, e os e-mails são de exemplo", () => {
    loadDemoData(db);

    const owners = db.prepare("SELECT nome, nome_normalizado, email FROM owners").all();
    for (const owner of owners) {
      assert.equal(owner.nome_normalizado, normalizeForSearch(owner.nome));
      assert.match(owner.email, /^[a-z.]+@example\.com$/);
    }
  });

  test("cada pet com pacote ganha a agenda automática", () => {
    loadDemoData(db);

    const withoutAgenda = count(
      db,
      `SELECT COUNT(*) AS total FROM pets p
       WHERE p.remarcacao_ativa = 1
         AND NOT EXISTS (
           SELECT 1 FROM appointments a
           WHERE a.pet_id = p.id AND a.is_auto_agen = 1 AND a.concluido = 0
         )`,
    );
    assert.equal(count(db, "SELECT COUNT(*) AS total FROM pets WHERE remarcacao_ativa = 1"), DEMO_DATA_SUMMARY.packages);
    assert.equal(withoutAgenda, 0);
  });

  test("a agenda dos pacotes é a que o cadastro pelo app gera, com o ponteiro no último automático", () => {
    loadDemoData(db);
    const clock = scheduleClockOf(today);

    const packagePets = db.prepare("SELECT id FROM pets WHERE remarcacao_ativa = 1").all();
    assert.equal(packagePets.length, DEMO_DATA_SUMMARY.packages);
    for (const { id } of packagePets) {
      const pet = petRow(db, id);
      const expected = scheduleForNewPet(packagePlanOf(pet, clock.today), clock, pet.horario_padrao);
      const agenda = appointmentsOf(db, id);

      assert.deepEqual(
        agenda.map((a) => ({ date: a.data, cents: a.valor, auto: a.is_auto_agen === 1 })),
        expected,
        pet.nome,
      );
      const { servico_padrao } = db.prepare(FIND_PET_SQL).get(id);
      assert.ok(agenda.every((a) => a.hora === pet.horario_padrao && a.servico === servico_padrao));
      assert.equal(pet.ultimo_visita_data_auto, expected.filter((visit) => visit.auto).at(-1).date);
    }
  });

  test("nada fica pendente no passado, e o futuro só tem agendamentos em aberto", () => {
    loadDemoData(db);

    assert.equal(
      count(db, `SELECT COUNT(*) AS total FROM appointments WHERE concluido = 0 AND data < ${todayDate}`),
      0,
    );
    assert.equal(
      count(db, `SELECT COUNT(*) AS total FROM appointments WHERE concluido = 1 AND data > ${todayDate}`),
      0,
    );
  });

  test("todo pet tem a última visita igual ao último atendimento concluído", () => {
    loadDemoData(db);

    const mismatched = count(
      db,
      `SELECT COUNT(*) AS total FROM pets p
       WHERE p.current_ultima_visita_data IS NOT
         (SELECT MAX(data) FROM appointments a WHERE a.pet_id = p.id AND a.concluido = 1)
          OR p.current_ultima_visita_data IS NULL`,
    );
    assert.equal(mismatched, 0);
  });

  test("os relatórios têm movimento: meses, ausentes, origem e horários", () => {
    loadDemoData(db);

    const monthsWithVisits = count(
      db,
      "SELECT COUNT(DISTINCT strftime('%Y-%m', data)) AS total FROM appointments WHERE concluido = 1",
    );
    assert.ok(monthsWithVisits >= 5, `concluídos em ${monthsWithVisits} meses`);

    const absentLimit = `'${isoDate(-40)}'`;
    const absentPets = count(
      db,
      `SELECT COUNT(*) AS total FROM pets WHERE is_ativo = 1 AND current_ultima_visita_data < ${absentLimit}`,
    );
    assert.ok(absentPets >= 3, `${absentPets} pets ausentes`);

    assert.ok(count(db, "SELECT COUNT(*) AS total FROM appointments WHERE concluido = 1 AND is_auto_agen = 0") > 0);
    assert.ok(count(db, "SELECT COUNT(*) AS total FROM appointments WHERE concluido = 0 AND is_auto_agen = 1") > 0);
    assert.ok(count(db, "SELECT COUNT(DISTINCT hora) AS total FROM appointments WHERE concluido = 1") >= 5);
  });

  test("o dono desativado e o pet dele entram desativados", () => {
    loadDemoData(db);

    assert.equal(count(db, "SELECT COUNT(*) AS total FROM owners WHERE is_ativo = 0"), 1);
    assert.equal(count(db, "SELECT COUNT(*) AS total FROM pets WHERE is_ativo = 0"), 1);
  });
});
