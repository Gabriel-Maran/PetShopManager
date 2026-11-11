// Caracterização da remarcação automática. Até a versão 3 do esquema ela vivia nos triggers; desde a
// 4, no PackageScheduleService (ARQ-2), e estes testes passam pelo mesmo caminho do app. Os testes
// "corrigido" eram os "confirmado" do TEST-1: descreviam o BUG-3 e o BUG-4, e a versão 2 do esquema
// inverteu a checagem.
import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  appointmentsOf,
  asMigrationDatabase,
  createDatabase,
  createPet,
  daysBetween,
  insertOwner,
  isoDate,
  monthOf,
  newPet,
  packageScheduleOf,
  pendingAutoOf,
  petRow,
  savePet,
  toDate,
} from "./helpers/database.mjs";
import { INSERT_PACKAGE_VISIT_SQL } from "../src/repository/sql/appointmentsSql.ts";

/** Os automáticos agrupados por mês, na ordem das datas. */
function autoByMonth(agenda) {
  const months = new Map();
  for (const a of agenda.filter((item) => item.is_auto_agen === 1)) {
    months.set(monthOf(a.data), [...(months.get(monthOf(a.data)) ?? []), a]);
  }
  return [...months.values()];
}

/** Salva o formulário de um agendamento como o app faz, mudando só os campos passados. */
const saveAppointment = (db, appointment, changes) =>
  packageScheduleOf(db).updateAppointment(appointment.id, { ...appointment, ...changes });

/** Conclui como o app: salva o formulário com o concluído marcado, o que cria o próximo automático. */
const concludeAppointment = (db, appointment) => saveAppointment(db, appointment, { concluido: 1 });

describe("agenda gerada ao cadastrar um pet com pacote", () => {
  let db;
  let ownerId;

  beforeEach(async () => {
    db = await createDatabase();
    ownerId = insertOwner(db);
  });

  for (const [pacote, gap, valor, porAtendimento] of [
    [2, 14, 20000, 10000],
    [4, 7, 32000, 8000],
  ]) {
    test(`pacote ${pacote}: a cada ${gap} dias, até ${pacote} por mês, no mesmo dia da semana`, async () => {
      const inicio = isoDate(3);
      const pet = await createPet(db, {
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
      assert.ok(last > isoDate(200) && last < isoDate(224 + 35), `última data: ${last}`);
      assert.equal(petRow(db, pet.id).ultimo_visita_data_auto, last);
    });
  }

  test("com início no passado, as datas que já passaram entram como manuais pendentes", async () => {
    const pet = await createPet(db, {
      dono_id: ownerId, remarcacao_ativa: 1, pacote_remarcacao: 4,
      data_inicio_pacote: isoDate(-30), valor_pacote: 32000,
    });
    const past = appointmentsOf(db, pet.id).filter((a) => a.data < isoDate(-1));

    assert.ok(past.length >= 3, `${past.length} datas passadas`);
    assert.ok(past.every((a) => a.is_auto_agen === 0 && a.concluido === 0));
  });

  for (const [pacote, valor, comSobra, semSobra] of [
    [4, 10003, 2501, 2500],
    [2, 20001, 10001, 10000],
  ]) {
    test(`pacote ${pacote} de ${valor} centavos: a sobra da divisão fica com os primeiros do mês`, async () => {
      const pet = await createPet(db, {
        dono_id: ownerId, remarcacao_ativa: 1, pacote_remarcacao: pacote,
        data_inicio_pacote: isoDate(3), valor_pacote: valor,
      });
      const sobra = valor % pacote;

      for (const month of autoByMonth(appointmentsOf(db, pet.id))) {
        month.forEach((a, index) => {
          assert.equal(a.valor, index < sobra ? comSobra : semSobra, `${a.data}, ${index + 1}º do mês`);
        });
        if (month.length === pacote) {
          assert.equal(month.reduce((total, a) => total + a.valor, 0), valor, "o mês cheio soma o pacote");
        }
      }
    });
  }

  test("o dia da semana calculado pelo banco é o da data", async () => {
    const pet = await createPet(db, {
      dono_id: ownerId, remarcacao_ativa: 1, pacote_remarcacao: 4, data_inicio_pacote: isoDate(3),
    });

    const agenda = db.prepare("SELECT data, dia_semana FROM appointments WHERE pet_id = ?").all(pet.id);
    assert.ok(agenda.length > 0);
    assert.ok(agenda.every((a) => a.dia_semana === toDate(a.data).getDay()));
  });

  test("o cadastro novo grava o dia de hoje do aparelho, em texto", async () => {
    const pet = await createPet(db, { dono_id: ownerId });

    assert.equal(petRow(db, pet.id).criado_em, isoDate(0));
    assert.equal(db.prepare("SELECT criado_em FROM owners WHERE id = ?").get(ownerId).criado_em, isoDate(0));
  });

  test("sem pacote, o cadastro não gera agenda", async () => {
    const pet = await createPet(db, { dono_id: ownerId });

    assert.equal(appointmentsOf(db, pet.id).length, 0);
  });
});

describe("conclusão de um agendamento automático", () => {
  let db;
  let pet;

  beforeEach(async () => {
    db = await createDatabase();
    pet = await createPet(db, {
      dono_id: insertOwner(db), remarcacao_ativa: 1, pacote_remarcacao: 4,
      data_inicio_pacote: isoDate(3), valor_pacote: 32000,
    });
  });

  test("concluir cria o próximo depois do último da agenda e grava a última visita", async () => {
    const [first] = pendingAutoOf(db, pet.id);
    const autoCount = appointmentsOf(db, pet.id).length;
    const lastBefore = petRow(db, pet.id).ultimo_visita_data_auto;

    await concludeAppointment(db, first);

    const agenda = appointmentsOf(db, pet.id);
    assert.equal(agenda.length, autoCount + 1);
    const newest = agenda.at(-1);
    assert.ok(newest.data > lastBefore);
    assert.equal(newest.is_auto_agen, 1);
    assert.equal(petRow(db, pet.id).current_ultima_visita_data, first.data);
    assert.equal(petRow(db, pet.id).ultimo_visita_data_auto, newest.data);
  });

  test("o próximo criado pela conclusão leva a sobra de centavos se for um dos primeiros do mês", async () => {
    await savePet(db, { ...pet, valor_pacote: 10003 });
    const [first] = pendingAutoOf(db, pet.id);

    await concludeAppointment(db, first);

    const agenda = appointmentsOf(db, pet.id);
    const newest = agenda.at(-1);
    const position = agenda.filter((a) => a.is_auto_agen === 1 && monthOf(a.data) === monthOf(newest.data)).length;
    assert.equal(newest.valor, position <= 10003 % 4 ? 2501 : 2500, `${newest.data}, ${position}º do mês`);
  });

  test("salvar um automático pendente, sem concluir, não cria nada", async () => {
    const [first] = pendingAutoOf(db, pet.id);
    const count = appointmentsOf(db, pet.id).length;

    await saveAppointment(db, first, { observacao: "Cliente pediu perfume" });

    assert.equal(appointmentsOf(db, pet.id).length, count);
  });

  test("BUG-3, corrigido: salvar de novo um automático já concluído não cria outro agendamento", async () => {
    const [first] = pendingAutoOf(db, pet.id);
    await concludeAppointment(db, first);
    const agendaBefore = appointmentsOf(db, pet.id);
    const concluded = agendaBefore.find((a) => a.id === first.id);

    // Marcar como pago regrava o formulário inteiro, com concluido = 1 de novo.
    await saveAppointment(db, concluded, { ta_pago: 1, tipo_pgto: "PIX" });

    const agenda = appointmentsOf(db, pet.id);
    assert.equal(agenda.length, agendaBefore.length);
    assert.equal(agenda.find((a) => a.id === first.id).ta_pago, 1);
  });

  test("salvar de novo um concluído antigo não volta a última visita para a data dele", async () => {
    const [first, second] = pendingAutoOf(db, pet.id);
    await concludeAppointment(db, first);
    await concludeAppointment(db, second);
    const concluded = appointmentsOf(db, pet.id).find((a) => a.id === first.id);

    await saveAppointment(db, concluded, { ta_pago: 1 });

    assert.equal(petRow(db, pet.id).current_ultima_visita_data, second.data);
  });
});

describe("edição do pet com pacote", () => {
  let db;
  let pet;
  let nextAuto;

  // Um pet com pacote desde 30 dias atrás, um automático futuro com o horário ajustado à mão e um
  // automático vencido, que ninguém concluiu.
  beforeEach(async () => {
    db = await createDatabase();
    pet = await createPet(db, {
      dono_id: insertOwner(db), remarcacao_ativa: 1, pacote_remarcacao: 4,
      data_inicio_pacote: isoDate(-30), horario_padrao: "10:00", valor_pacote: 32000,
    });
    [nextAuto] = pendingAutoOf(db, pet.id).filter((a) => a.data > isoDate(1));
    await saveAppointment(db, nextAuto, { hora: "15:30" });
    db.prepare(
      `INSERT INTO appointments (pet_id, servico_id, servico_nome, data, hora, is_auto_agen)
       VALUES (?, (SELECT id FROM service_type WHERE servico = 'Banho'), 'Banho', ?, '10:00', 1)`,
    ).run(pet.id, isoDate(-5));
  });

  const pastOf = (petId) => appointmentsOf(db, petId).filter((a) => a.data < isoDate(-1));
  const futureAutoOf = (petId) => pendingAutoOf(db, petId).filter((a) => a.data > isoDate(1));

  test("BUG-4, corrigido: mudar só a observação não mexe na agenda", async () => {
    const agendaBefore = appointmentsOf(db, pet.id);
    // Sem datas passadas ou sem automático futuro, o teste não provaria nada.
    assert.ok(pastOf(pet.id).length >= 3 && nextAuto, "o cenário precisa de datas passadas e de um automático futuro");

    await savePet(db, { ...pet, observacoes: "Mudou só a observação" });

    assert.deepEqual(appointmentsOf(db, pet.id), agendaBefore);
  });

  for (const [campo, mudanca, confere] of [
    ["o horário", { horario_padrao: "16:00" }, (a) => a.hora === "16:00"],
    ["o serviço", { servico_padrao: "Banho e Tosa" }, (a) => a.servico === "Banho e Tosa"],
    ["o valor", { valor_pacote: 40000 }, (a) => a.valor === 10000],
  ]) {
    test(`trocar ${campo} refaz os automáticos de hoje em diante e mantém o que já passou`, async () => {
      const pastBefore = pastOf(pet.id);

      await savePet(db, { ...pet, ...mudanca });

      const future = futureAutoOf(pet.id);
      assert.ok(future.length > 0);
      assert.ok(future.every(confere), `os futuros seguem ${campo} novo`);
      assert.deepEqual(pastOf(pet.id), pastBefore, "nada que já passou foi apagado ou criado de novo");
      assert.equal(petRow(db, pet.id).ultimo_visita_data_auto, future.at(-1).data);
    });
  }

  test("trocar o pacote de 4 para 2 refaz os futuros a cada 14 dias", async () => {
    await savePet(db, { ...pet, pacote_remarcacao: 2, valor_pacote: 20000 });

    const future = futureAutoOf(pet.id);
    assert.ok(future.length >= 2);
    assert.ok(future.every((a) => a.valor === 10000));
    for (let i = 1; i < future.length; i++) {
      if (monthOf(future[i].data) === monthOf(future[i - 1].data)) {
        assert.equal(daysBetween(future[i - 1].data, future[i].data), 14);
      }
    }
  });
});

describe("desligar a remarcação", () => {
  test("apaga os automáticos pendentes a partir de amanhã", async () => {
    const db = await createDatabase();
    const pet = await createPet(db, {
      dono_id: insertOwner(db), remarcacao_ativa: 1, pacote_remarcacao: 2,
      data_inicio_pacote: isoDate(3), valor_pacote: 20000,
    });

    // Com a remarcação desligada, o formulário manda o pacote, o início e o valor vazios.
    await savePet(db, { ...pet, remarcacao_ativa: 0, pacote_remarcacao: null, data_inicio_pacote: null, valor_pacote: null });

    assert.equal(pendingAutoOf(db, pet.id).filter((a) => a.data > isoDate(1)).length, 0);
  });
});

describe("a remarcação grava tudo numa transação", () => {
  /** A conexão do teste com a gravação de um atendimento do pacote falhando, como num disco cheio. */
  function failingOnVisit(db, { after = 0 } = {}) {
    const connection = asMigrationDatabase(db);
    let inserts = 0;
    return {
      ...connection,
      runAsync: async (sql, ...params) => {
        if (sql === INSERT_PACKAGE_VISIT_SQL && ++inserts > after) throw new Error("disk I/O error");
        return connection.runAsync(sql, ...params);
      },
    };
  }

  const count = (db, table) => db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get().total;
  const PACOTE = { remarcacao_ativa: 1, pacote_remarcacao: 4, data_inicio_pacote: isoDate(3), valor_pacote: 32000 };

  test("se a agenda falha no meio do cadastro, o pet também não fica", async () => {
    const db = await createDatabase();
    const dono_id = insertOwner(db);
    const schedule = packageScheduleOf(db, failingOnVisit(db, { after: 3 }));

    await assert.rejects(schedule.createPet(newPet({ dono_id, ...PACOTE }), new Date()), /disk I\/O error/);

    assert.equal(count(db, "pets"), 0);
    assert.equal(count(db, "appointments"), 0);
    // Sem transação presa: o próximo cadastro grava normalmente.
    const pet = await createPet(db, { dono_id, ...PACOTE });
    assert.ok(pendingAutoOf(db, pet.id).length > 0);
  });

  test("se o próximo automático falha, a conclusão é desfeita e a última visita não muda", async () => {
    const db = await createDatabase();
    const pet = await createPet(db, { dono_id: insertOwner(db), ...PACOTE });
    const [first] = pendingAutoOf(db, pet.id);
    const before = appointmentsOf(db, pet.id);

    await assert.rejects(
      packageScheduleOf(db, failingOnVisit(db)).updateAppointment(first.id, { ...first, concluido: 1 }),
      /disk I\/O error/,
    );

    assert.deepEqual(appointmentsOf(db, pet.id), before);
    assert.equal(petRow(db, pet.id).current_ultima_visita_data, null);
  });

  test("se refazer a agenda falha, a edição do pet é desfeita", async () => {
    const db = await createDatabase();
    const pet = await createPet(db, { dono_id: insertOwner(db), ...PACOTE });
    const before = { pet: petRow(db, pet.id), agenda: appointmentsOf(db, pet.id) };

    await assert.rejects(
      packageScheduleOf(db, failingOnVisit(db)).updatePet(pet.id, { ...pet, horario_padrao: "16:00" }, new Date()),
      /disk I\/O error/,
    );

    assert.deepEqual(petRow(db, pet.id), before.pet);
    assert.deepEqual(appointmentsOf(db, pet.id), before.agenda);
  });

  test("ids que não existem não gravam nada nem criam agenda", async () => {
    const db = await createDatabase();
    const pet = await createPet(db, { dono_id: insertOwner(db), ...PACOTE });
    const [first] = pendingAutoOf(db, pet.id);
    const before = appointmentsOf(db, pet.id);
    const schedule = packageScheduleOf(db);

    await schedule.updateAppointment(999999, { ...first, concluido: 1 });
    await schedule.updatePet(999999, { ...pet, horario_padrao: "16:00" }, new Date());
    await schedule.activatePet(999999, new Date());

    assert.deepEqual(appointmentsOf(db, pet.id), before);
    assert.equal(count(db, "pets"), 1);
  });

  test("a observação com SQL vai como texto para o próximo automático", async () => {
    const db = await createDatabase();
    const pet = await createPet(db, { dono_id: insertOwner(db), ...PACOTE });
    const [first] = pendingAutoOf(db, pet.id);
    const observacao = "Ração'); DROP TABLE pets; --";

    await saveAppointment(db, first, { concluido: 1, observacao });

    assert.equal(appointmentsOf(db, pet.id).at(-1).observacao, observacao);
    assert.equal(count(db, "pets"), 1);
  });
});
