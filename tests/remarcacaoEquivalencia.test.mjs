// A remarcação em TypeScript (versão 4 do esquema, ARQ-2) contra os triggers da versão 3, que eram a
// regra até ali. Os mesmos passos rodam nos dois bancos, cada um pelo caminho da sua época, e as
// tabelas de pets e agendamentos precisam terminar iguais, linha a linha e com os mesmos ids. O banco
// da versão 3 sobe para a última no fim, pelas migrações do app, porque desde a versão 6 o serviço e a
// forma de pagamento são gravados pelo id: assim, o teste também confere a conversão da versão 6.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  appointmentsOf,
  asMigrationDatabase,
  createDatabase,
  createPet,
  databaseAt,
  insertOwner,
  insertPet,
  isoDate,
  packageScheduleOf,
  pendingAutoOf,
  savePet,
  updatePet,
} from "./helpers/database.mjs";
import { migrateDatabase } from "../src/config/migrator.ts";
import { MIGRATIONS } from "../src/config/schema.ts";
import { ACTIVATE_PET_SQL, DEACTIVATE_PET_SQL } from "../src/repository/sql/petsSql.ts";
import { DEACTIVATE_OWNER_SQL } from "../src/repository/sql/ownersSql.ts";

/** O UPDATE do agendamento da época da versão 3, com o serviço e o pagamento pelo nome. */
const UPDATE_APPOINTMENT_V3_SQL = `UPDATE appointments SET pet_id = ?, servico = ?, data = ?, hora = ?,
  entregar_pet = ?, concluido = ?, observacao = ?, valor = ?, tipo_pgto = ?, ta_pago = ?
  WHERE id = ?`;

/** Versão 3: o app só gravava, e os triggers faziam a agenda. */
const BY_TRIGGERS = {
  createPet: async (db, fields) => insertPet(db, fields),
  savePet: async (db, pet) => updatePet(db, pet),
  activatePet: async (db, id) => {
    db.prepare(ACTIVATE_PET_SQL).run(id);
  },
  saveAppointment: async (db, a) => {
    db.prepare(UPDATE_APPOINTMENT_V3_SQL).run(
      a.pet_id, a.servico, a.data, a.hora, a.entregar_pet, a.concluido, a.observacao,
      a.valor, a.tipo_pgto, a.ta_pago, a.id,
    );
  },
};

/** Versão 4: o app grava pela remarcação em TypeScript. */
const BY_SERVICE = {
  createPet: (db, fields) => createPet(db, fields),
  savePet: (db, pet) => savePet(db, pet),
  activatePet: (db, id) => packageScheduleOf(db).activatePet(id, new Date()),
  saveAppointment: (db, a) => packageScheduleOf(db).updateAppointment(a.id, a),
};

const rows = (db, table) => db.prepare(`SELECT * FROM ${table} ORDER BY id`).all();

/**
 * Roda o cenário no banco da versão 3 e no da última versão e confere que os dois terminam iguais,
 * depois de o da versão 3 subir pelas migrações. O cenário recebe o banco, o dono e os passos da época.
 */
async function assertSameOutcome(scenario) {
  const outcomes = [];
  for (const [db, steps] of [[await databaseAt(3), BY_TRIGGERS], [await createDatabase(), BY_SERVICE]]) {
    await scenario(db, insertOwner(db), steps);
    await migrateDatabase(asMigrationDatabase(db), MIGRATIONS);
    outcomes.push({ pets: rows(db, "pets"), appointments: rows(db, "appointments") });
  }
  const [byTriggers, byService] = outcomes;
  assert.ok(byTriggers.appointments.length > 0, "o cenário precisa gerar agenda");
  assert.deepEqual(byService.pets, byTriggers.pets);
  assert.deepEqual(byService.appointments, byTriggers.appointments);
}

/** Conclui os primeiros `count` automáticos pendentes, um de cada vez, como o app. */
async function concludeNext(db, steps, petId, count, changes = {}) {
  for (let i = 0; i < count; i++) {
    const [next] = pendingAutoOf(db, petId);
    await steps.saveAppointment(db, { ...next, concluido: 1, ...changes });
  }
}

const PACKAGE = { remarcacao_ativa: 1, pacote_remarcacao: 4, valor_pacote: 10003, horario_padrao: "09:30" };

describe("remarcação em TypeScript igual à dos triggers da versão 3", () => {
  test("cadastro: início em cada dia de 70 dias atrás a 70 dias à frente, nos dois pacotes", async () => {
    await assertSameOutcome(async (db, dono_id, steps) => {
      for (let offset = -70; offset <= 70; offset++) {
        for (const [pacote_remarcacao, valor_pacote] of [[4, 10003], [2, 20001]]) {
          await steps.createPet(db, {
            ...PACKAGE, dono_id, pacote_remarcacao, valor_pacote, data_inicio_pacote: isoDate(offset),
          });
        }
      }
    });
  });

  test("cadastro: sem data de início, sem valor e com o horário de hoje já passado ou não", async () => {
    await assertSameOutcome(async (db, dono_id, steps) => {
      await steps.createPet(db, { ...PACKAGE, dono_id, data_inicio_pacote: null });
      await steps.createPet(db, { ...PACKAGE, dono_id, data_inicio_pacote: isoDate(0), valor_pacote: null });
      await steps.createPet(db, { ...PACKAGE, dono_id, data_inicio_pacote: isoDate(0), horario_padrao: "00:00" });
      await steps.createPet(db, { ...PACKAGE, dono_id, data_inicio_pacote: isoDate(0), horario_padrao: "23:59" });
      await steps.createPet(db, { dono_id, nome: "Sem pacote" });
    });
  });

  test("conclusões seguidas, com o mês cheio pulando para o seguinte", async () => {
    await assertSameOutcome(async (db, dono_id, steps) => {
      const mensal = await steps.createPet(db, { ...PACKAGE, dono_id, data_inicio_pacote: isoDate(-20) });
      const quinzenal = await steps.createPet(db, {
        ...PACKAGE, dono_id, pacote_remarcacao: 2, valor_pacote: 20001, data_inicio_pacote: isoDate(5),
      });
      await concludeNext(db, steps, mensal.id, 12, { entregar_pet: 1, observacao: "Táxi dog; '); DROP TABLE pets; --" });
      await concludeNext(db, steps, quinzenal.id, 8, { servico: "Banho e Tosa" });
    });
  });

  test("concluir mudando a data no mesmo formulário usa o dia da semana novo", async () => {
    await assertSameOutcome(async (db, dono_id, steps) => {
      const pet = await steps.createPet(db, { ...PACKAGE, dono_id, data_inicio_pacote: isoDate(3) });
      for (let i = 0; i < 6; i++) {
        const [next] = pendingAutoOf(db, pet.id);
        await steps.saveAppointment(db, { ...next, concluido: 1, data: isoDate(1 + i) });
      }
    });
  });

  test("salvar de novo um concluído e concluir um manual não criam nada", async () => {
    await assertSameOutcome(async (db, dono_id, steps) => {
      const pet = await steps.createPet(db, { ...PACKAGE, dono_id, data_inicio_pacote: isoDate(-30) });
      const [manual] = appointmentsOf(db, pet.id).filter((a) => a.is_auto_agen === 0);
      await steps.saveAppointment(db, { ...manual, concluido: 1 });
      await concludeNext(db, steps, pet.id, 1);
      const [concluded] = appointmentsOf(db, pet.id).filter((a) => a.is_auto_agen === 1 && a.concluido === 1);
      await steps.saveAppointment(db, { ...concluded, ta_pago: 1, tipo_pgto: "PIX" });
    });
  });

  test("edições do pet: só a observação, cada campo da agenda, e com dias já concluídos no futuro", async () => {
    await assertSameOutcome(async (db, dono_id, steps) => {
      let pet = await steps.createPet(db, { ...PACKAGE, dono_id, data_inicio_pacote: isoDate(-30) });
      await concludeNext(db, steps, pet.id, 3);
      for (const change of [
        { observacoes: "Mudou só a observação" },
        { horario_padrao: "16:00" },
        { servico_padrao: "Banho e Tosa" },
        { valor_pacote: 40001 },
        { pacote_remarcacao: 2 },
        { data_inicio_pacote: isoDate(-3) },
        { data_inicio_pacote: isoDate(12) },
        { pacote_remarcacao: 4, data_inicio_pacote: isoDate(-45) },
      ]) {
        pet = { ...pet, ...change };
        await steps.savePet(db, pet);
      }
    });
  });

  test("desligar e religar o pacote, desativar e reativar o pet e o dono", async () => {
    await assertSameOutcome(async (db, dono_id, steps) => {
      const pet = await steps.createPet(db, { ...PACKAGE, dono_id, data_inicio_pacote: isoDate(-10) });
      const off = { ...pet, remarcacao_ativa: 0, pacote_remarcacao: null, data_inicio_pacote: null, valor_pacote: null };
      await steps.savePet(db, off);
      await steps.savePet(db, { ...pet, data_inicio_pacote: isoDate(2) });

      db.prepare(DEACTIVATE_PET_SQL).run(pet.id);
      await steps.activatePet(db, pet.id);
      await steps.savePet(db, { ...pet, data_inicio_pacote: isoDate(-5) });

      db.prepare(DEACTIVATE_OWNER_SQL).run(dono_id);
      await steps.savePet(db, { ...pet, valor_pacote: 50000 }); // inativo: só grava o pet
      await steps.activatePet(db, pet.id);
    });
  });
});
