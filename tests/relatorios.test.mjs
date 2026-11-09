// SQL dos relatórios com as datas em texto "AAAA-MM-DD" (versão 3 do esquema). O "hoje" e os
// intervalos são parâmetros, então as datas aqui podem ser fixas.
import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { createDatabase, insertOwner, insertPet, isoDate } from "./helpers/database.mjs";
import { INSERT_APPOINTMENT_SQL } from "../app/repository/sql/appointmentsSql.ts";
import { DEACTIVATE_PET_SQL } from "../app/repository/sql/petsSql.ts";
import { APPOINTMENTS_BY_MONTH_SQL, PETS_AUSENTES_SQL } from "../app/repository/sql/relatoriosSql.ts";

/** Agendamento manual, com os parâmetros na ordem do INSERT_APPOINTMENT_SQL. */
function insertAppointment(db, petId, data, { concluido = 0 } = {}) {
  db.prepare(INSERT_APPOINTMENT_SQL).run(petId, "Banho", data, "10:00", 0, concluido, null, 0, 5000, "Pix", 0);
}

const setPet = (db, id, column, value) =>
  db.prepare(`UPDATE pets SET ${column} = ? WHERE id = ?`).run(value, id);

describe("relatório: atendimentos por mês", () => {
  let db;

  beforeEach(async () => {
    db = await createDatabase();
    const petId = insertPet(db, { dono_id: insertOwner(db) }).id;

    insertAppointment(db, petId, "2025-12-31", { concluido: 1 }); // antes do intervalo
    insertAppointment(db, petId, "2026-01-01", { concluido: 1 }); // primeiro dia do intervalo
    insertAppointment(db, petId, "2026-01-31", { concluido: 1 });
    insertAppointment(db, petId, "2026-02-01", { concluido: 1 });
    insertAppointment(db, petId, "2026-02-28", { concluido: 1 }); // último dia do intervalo
    insertAppointment(db, petId, "2026-02-15"); // pendente
    insertAppointment(db, petId, "2026-03-01", { concluido: 1 }); // depois do intervalo
  });

  test("agrupa os concluídos por AAAA-MM, com as duas pontas do intervalo", () => {
    const rows = db.prepare(APPOINTMENTS_BY_MONTH_SQL).all(1, "2026-01-01", "2026-02-28");

    assert.deepEqual(rows.map((r) => ({ ...r })), [
      { ano_mes: "2026-01", total: 2 },
      { ano_mes: "2026-02", total: 2 },
    ]);
  });

  test("conta só os pendentes quando pedido", () => {
    const rows = db.prepare(APPOINTMENTS_BY_MONTH_SQL).all(0, "2026-01-01", "2026-12-31");

    assert.deepEqual(rows.map((r) => ({ ...r })), [{ ano_mes: "2026-02", total: 1 }]);
  });
});

describe("relatório: pets ausentes", () => {
  const TODAY = "2026-11-08";
  let db;
  let ownerId;

  beforeEach(async () => {
    db = await createDatabase();
    ownerId = insertOwner(db, { nome: "Ana" });
  });

  const ausentes = (remarcacaoAtiva, limite = 30) =>
    db.prepare(PETS_AUSENTES_SQL).all(TODAY, remarcacaoAtiva, limite).map((r) => ({ ...r }));

  test("conta os dias desde a última visita e, para quem nunca veio, desde o cadastro", () => {
    const visited = insertPet(db, { nome: "Rex", dono_id: ownerId });
    setPet(db, visited.id, "current_ultima_visita_data", "2026-10-29");
    const neverCame = insertPet(db, { nome: "Mel", dono_id: ownerId });
    setPet(db, neverCame.id, "criado_em", "2026-11-01");

    const rows = ausentes(0);

    // Quem nunca veio (última visita nula) vem primeiro, como no relatório de antes.
    assert.deepEqual(
      rows.map((r) => [r.pet_id, r.dias_ausente, r.ultima_visita]),
      [
        [neverCame.id, 7, null],
        [visited.id, 10, "2026-10-29"],
      ],
    );
    assert.equal(rows[1].label, "Rex · Ana");
  });

  test("a virada de mês e de ano conta os dias do calendário", () => {
    const pet = insertPet(db, { dono_id: ownerId });
    setPet(db, pet.id, "current_ultima_visita_data", "2025-11-08");

    assert.equal(ausentes(0)[0].dias_ausente, 365);
  });

  test("uma visita marcada no futuro não dá dias negativos", () => {
    const pet = insertPet(db, { dono_id: ownerId });
    setPet(db, pet.id, "current_ultima_visita_data", "2026-11-20");

    assert.equal(ausentes(0)[0].dias_ausente, 0);
  });

  test("separa os pets com e sem remarcação, ignora os inativos e respeita o limite", () => {
    const withPackage = insertPet(db, {
      nome: "Thor", dono_id: ownerId, remarcacao_ativa: 1, pacote_remarcacao: 4,
      data_inicio_pacote: isoDate(3), valor_pacote: 32000,
    });
    const inactive = insertPet(db, { nome: "Bob", dono_id: ownerId });
    db.prepare(DEACTIVATE_PET_SQL).run(inactive.id);
    insertPet(db, { nome: "Mel", dono_id: ownerId });
    insertPet(db, { nome: "Nina", dono_id: ownerId });

    assert.deepEqual(ausentes(1).map((r) => r.pet_id), [withPackage.id]);
    assert.equal(ausentes(0).length, 2);
    assert.equal(ausentes(0, 1).length, 1);
  });
});
