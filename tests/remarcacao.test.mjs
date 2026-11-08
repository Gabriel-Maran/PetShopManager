// Caracterização da remarcação automática, que vive nos triggers: o que o app faz hoje, inclusive os
// bugs. Um teste "confirmado" descreve um bug que existe hoje; a correção (Parte 3 do plano) inverte
// a checagem dele.
import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  appointmentsOf,
  createDatabase,
  dateInt,
  daysBetween,
  insertOwner,
  insertPet,
  pendingAutoOf,
  petRow,
  toDate,
  updatePet,
} from "./helpers/database.mjs";
import {
  CONCLUDE_APPOINTMENT_SQL,
  UPDATE_APPOINTMENT_SQL,
} from "../app/repository/sql/appointmentsSql.ts";
import { UPDATE_PET_REMARCACAO_SQL } from "../app/repository/sql/petsSql.ts";

const monthOf = (data) => Math.floor(data / 100);

/** Salva o formulário de um agendamento como o app faz, mudando só os campos passados. */
function saveAppointment(db, appointment, changes) {
  const a = { ...appointment, ...changes };
  db.prepare(UPDATE_APPOINTMENT_SQL).run(
    a.pet_id, a.servico, a.data, a.hora, a.entregar_pet, a.concluido, a.observacao,
    a.valor, a.tipo_pgto, a.ta_pago, a.id,
  );
}

describe("agenda gerada ao cadastrar um pet com pacote", () => {
  let db;
  let ownerId;

  beforeEach(async () => {
    db = await createDatabase();
    ownerId = insertOwner(db);
  });

  for (const [pacote, gap, valor, porAtendimento] of [
    [2, 14, "200,00", "100,00"],
    [4, 7, "320,00", "80,00"],
  ]) {
    test(`pacote ${pacote}: a cada ${gap} dias, até ${pacote} por mês, no mesmo dia da semana`, () => {
      const inicio = dateInt(3);
      const pet = insertPet(db, {
        dono_id: ownerId, remarcacao_ativa: 1, pacote_remarcacao: pacote,
        data_inicio_pacote: inicio, horario_padrao: "09:30", valor_pacote: valor,
      });
      const agenda = appointmentsOf(db, pet.id);

      assert.equal(agenda[0].data, inicio);
      assert.ok(agenda.every((a) => a.is_auto_agen === 1 && a.concluido === 0));
      assert.ok(agenda.every((a) => a.hora === "09:30" && a.valor === porAtendimento));

      const weekday = toDate(inicio).getDay();
      assert.ok(agenda.every((a) => toDate(a.data).getDay() === weekday));

      const perMonth = new Map();
      for (const a of agenda) perMonth.set(monthOf(a.data), (perMonth.get(monthOf(a.data)) ?? 0) + 1);
      assert.ok([...perMonth.values()].every((count) => count <= pacote));

      for (let i = 1; i < agenda.length; i++) {
        if (monthOf(agenda[i].data) === monthOf(agenda[i - 1].data)) {
          assert.equal(daysBetween(agenda[i - 1].data, agenda[i].data), gap);
        }
      }

      // A agenda vai até cerca de 224 dias (PERIODO_REMARCACAO); um salto de mês pode passar um pouco.
      const last = agenda.at(-1).data;
      assert.ok(last > dateInt(200) && last < dateInt(224 + 35), `última data: ${last}`);
      assert.equal(petRow(db, pet.id).ultimo_visita_data_auto, last);
    });
  }

  test("com início no passado, as datas que já passaram entram como manuais pendentes", () => {
    const pet = insertPet(db, {
      dono_id: ownerId, remarcacao_ativa: 1, pacote_remarcacao: 4,
      data_inicio_pacote: dateInt(-30), valor_pacote: "320,00",
    });
    const past = appointmentsOf(db, pet.id).filter((a) => a.data < dateInt(-1));

    assert.ok(past.length >= 3, `${past.length} datas passadas`);
    assert.ok(past.every((a) => a.is_auto_agen === 0 && a.concluido === 0));
  });

  test("sem pacote, o cadastro não gera agenda", () => {
    const pet = insertPet(db, { dono_id: ownerId });

    assert.equal(appointmentsOf(db, pet.id).length, 0);
  });
});

describe("conclusão de um agendamento automático", () => {
  let db;
  let pet;

  beforeEach(async () => {
    db = await createDatabase();
    pet = insertPet(db, {
      dono_id: insertOwner(db), remarcacao_ativa: 1, pacote_remarcacao: 4,
      data_inicio_pacote: dateInt(3), valor_pacote: "320,00",
    });
  });

  test("concluir cria o próximo depois do último da agenda e grava a última visita", () => {
    const [first] = pendingAutoOf(db, pet.id);
    const autoCount = appointmentsOf(db, pet.id).length;
    const lastBefore = petRow(db, pet.id).ultimo_visita_data_auto;

    db.prepare(CONCLUDE_APPOINTMENT_SQL).run(first.id);

    const agenda = appointmentsOf(db, pet.id);
    assert.equal(agenda.length, autoCount + 1);
    const newest = agenda.at(-1);
    assert.ok(newest.data > lastBefore);
    assert.equal(newest.is_auto_agen, 1);
    assert.equal(petRow(db, pet.id).current_ultima_visita_data, first.data);
    assert.equal(petRow(db, pet.id).ultimo_visita_data_auto, newest.data);
  });

  test("salvar um automático pendente, sem concluir, não cria nada", () => {
    const [first] = pendingAutoOf(db, pet.id);
    const count = appointmentsOf(db, pet.id).length;

    saveAppointment(db, first, { observacao: "Cliente pediu perfume" });

    assert.equal(appointmentsOf(db, pet.id).length, count);
  });

  test("BUG-3, confirmado: salvar de novo um automático já concluído cria mais um agendamento", () => {
    const [first] = pendingAutoOf(db, pet.id);
    db.prepare(CONCLUDE_APPOINTMENT_SQL).run(first.id);
    const count = appointmentsOf(db, pet.id).length;
    const concluded = appointmentsOf(db, pet.id).find((a) => a.id === first.id);

    // Marcar como pago regrava o formulário inteiro, com concluido = 1 de novo.
    saveAppointment(db, concluded, { ta_pago: 1, tipo_pgto: "PIX" });

    assert.equal(appointmentsOf(db, pet.id).length, count + 1);
  });
});

describe("edição do pet com pacote", () => {
  test("BUG-4, confirmado: mudar só a observação refaz a agenda, perde o horário ajustado e duplica as datas passadas", async () => {
    const db = await createDatabase();
    const pet = insertPet(db, {
      dono_id: insertOwner(db), remarcacao_ativa: 1, pacote_remarcacao: 4,
      data_inicio_pacote: dateInt(-30), valor_pacote: "320,00",
    });
    const pastBefore = appointmentsOf(db, pet.id).filter((a) => a.data < dateInt(-1)).length;
    const [nextAuto] = pendingAutoOf(db, pet.id).filter((a) => a.data > dateInt(1));
    // Sem datas passadas ou sem automático futuro, o teste não provaria nada.
    assert.ok(pastBefore >= 3 && nextAuto, "o cenário precisa de datas passadas e de um automático futuro");
    saveAppointment(db, nextAuto, { hora: "15:30" });

    updatePet(db, { ...pet, observacoes: "Mudou só a observação" });

    const agenda = appointmentsOf(db, pet.id);
    const pastAfter = agenda.filter((a) => a.data < dateInt(-1)).length;
    assert.equal(pastAfter, pastBefore * 2, "as datas passadas foram criadas de novo");
    assert.ok(!agenda.some((a) => a.hora === "15:30"), "o horário ajustado à mão se perdeu");
  });

  test("desligar a remarcação apaga os automáticos pendentes a partir de amanhã", async () => {
    const db = await createDatabase();
    const pet = insertPet(db, {
      dono_id: insertOwner(db), remarcacao_ativa: 1, pacote_remarcacao: 2,
      data_inicio_pacote: dateInt(3), valor_pacote: "200,00",
    });

    db.prepare(UPDATE_PET_REMARCACAO_SQL).run(0, null, null, null, pet.id);

    assert.equal(pendingAutoOf(db, pet.id).filter((a) => a.data > dateInt(1)).length, 0);
  });
});
