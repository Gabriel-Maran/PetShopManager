// A regra pura da remarcação (domain/packageSchedule.ts e domain/isoCalendar.ts), com o "hoje" fixo:
// sem banco e sem relógio, os casos-limite do calendário ficam exatos.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  addDays,
  firstDayOfNextMonth,
  monthOf,
  sameWeekdayInNextMonth,
  weekdayOf,
} from "../src/domain/isoCalendar.ts";
import {
  buildPackageSchedule,
  isAutoVisitConclusion,
  nextPackageVisitDate,
  packagePlanOf,
  SCHEDULE_HORIZON_DAYS,
  scheduleClockOf,
  scheduleForNewPet,
  scheduleFromToday,
  shouldRebuildSchedule,
  visitCents,
} from "../src/domain/packageSchedule.ts";

const TODAY = "2026-11-10"; // terça-feira
const dates = (visits) => visits.map((visit) => visit.date);

/** Um pacote de 4 por mês desde a terça 03/11/2026, de R$ 100,03 (a sobra de 3 centavos vai para os primeiros). */
const MENSAL = { visitsPerMonth: 4, start: "2026-11-03", priceCents: 10003 };

describe("calendário em texto AAAA-MM-DD", () => {
  test("somar dias atravessa o fim do mês, o 29/02 e a virada do ano", () => {
    assert.equal(addDays("2026-01-31", 1), "2026-02-01");
    assert.equal(addDays("2028-02-28", 1), "2028-02-29", "2028 é bissexto");
    assert.equal(addDays("2027-02-28", 1), "2027-03-01", "2027 não é");
    assert.equal(addDays("2026-12-29", 7), "2027-01-05");
    assert.equal(addDays("2027-01-05", -7), "2026-12-29");
    assert.equal(addDays("2026-11-10", SCHEDULE_HORIZON_DAYS), "2027-06-22");
  });

  test("anos com menos de quatro dígitos não viram 19xx", () => {
    assert.equal(addDays("0099-12-31", 1), "0100-01-01");
    assert.equal(firstDayOfNextMonth("0050-12-15"), "0051-01-01");
  });

  test("dia da semana como o strftime('%w'): 0 é domingo", () => {
    assert.equal(weekdayOf("2026-11-08"), 0);
    assert.equal(weekdayOf("2026-11-10"), 2);
    assert.equal(weekdayOf("2028-02-29"), 2);
    assert.equal(weekdayOf("2026-01-31"), 6);
  });

  test("primeiro dia do mês seguinte, inclusive a partir do dia 31 e de dezembro", () => {
    assert.equal(firstDayOfNextMonth("2026-01-31"), "2026-02-01");
    assert.equal(firstDayOfNextMonth("2026-12-31"), "2027-01-01");
    assert.equal(firstDayOfNextMonth("2028-02-29"), "2028-03-01");
  });

  test("o mesmo dia da semana no mês seguinte pode ser o dia 1 ou até o dia 7", () => {
    assert.equal(sameWeekdayInNextMonth("2026-11-24", 2), "2026-12-01", "01/12/2026 já é terça");
    assert.equal(sameWeekdayInNextMonth("2026-12-22", 2), "2027-01-05");
    assert.equal(sameWeekdayInNextMonth("2026-12-22", 4), "2027-01-07");
    assert.equal(sameWeekdayInNextMonth("2026-02-28", 6), "2026-03-07", "01/03/2026 é domingo");
  });

  test("o mês é a chave AAAA-MM", () => {
    assert.equal(monthOf("2026-11-10"), "2026-11");
  });

  test("o resultado não muda com o fuso do aparelho, nem com o horário de verão", () => {
    const moduleUrl = new URL("../src/domain/packageSchedule.ts", import.meta.url).href;
    const script = `
      const { buildPackageSchedule } = await import(${JSON.stringify(moduleUrl)});
      const plan = { visitsPerMonth: 2, start: "2026-10-31", priceCents: 20001 };
      process.stdout.write(JSON.stringify(buildPackageSchedule(plan, "2026-11-01")));
    `;
    const runIn = (timeZone) =>
      execFileSync(process.execPath, ["--input-type=module", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "-e", script], {
        env: { ...process.env, TZ: timeZone },
        encoding: "utf8",
      });

    const expected = runIn("UTC");
    for (const timeZone of ["America/Sao_Paulo", "America/New_York", "Europe/Lisbon", "Pacific/Kiritimati", "Pacific/Pago_Pago"]) {
      assert.equal(runIn(timeZone), expected, timeZone);
    }
  });
});

describe("agenda do pacote", () => {
  test("pacote de 4: a cada 7 dias até o 4º do mês, depois o mesmo dia da semana do mês seguinte", () => {
    const schedule = buildPackageSchedule(MENSAL, TODAY);

    assert.deepEqual(dates(schedule).slice(0, 10), [
      "2026-11-03", "2026-11-10", "2026-11-17", "2026-11-24",
      "2026-12-01", "2026-12-08", "2026-12-15", "2026-12-22",
      "2027-01-05", "2027-01-12",
    ]);
    assert.ok(schedule.every((visit) => weekdayOf(visit.date) === 2), "sempre na terça do início");
  });

  test("a sobra dos centavos fica com os primeiros de cada mês, e o mês cheio soma o pacote", () => {
    const november = buildPackageSchedule(MENSAL, TODAY).filter((visit) => monthOf(visit.date) === "2026-11");

    assert.deepEqual(november.map((visit) => visit.cents), [2501, 2501, 2501, 2500]);
    assert.equal(november.reduce((total, visit) => total + visit.cents, 0), 10003);
  });

  test("pacote de 2 começando no dia 31: a soma que cai no mês seguinte recomeça a contagem dele", () => {
    const schedule = buildPackageSchedule({ visitsPerMonth: 2, start: "2026-01-31", priceCents: 20001 }, "2026-01-31");

    assert.deepEqual(dates(schedule).slice(0, 6), [
      "2026-01-31", // 1º de janeiro
      "2026-02-14", // +14 já é fevereiro: 1º do mês
      "2026-02-28", // 2º: fevereiro cheio
      "2026-03-07", // primeiro sábado de março
      "2026-03-21",
      "2026-04-04",
    ]);
    assert.deepEqual(schedule.slice(0, 3).map((visit) => visit.cents), [10001, 10001, 10000]);
  });

  test("início em 29/02 de ano bissexto", () => {
    const schedule = buildPackageSchedule({ visitsPerMonth: 4, start: "2028-02-29", priceCents: 32000 }, "2028-02-01");

    assert.deepEqual(dates(schedule).slice(0, 6), [
      "2028-02-29", "2028-03-07", "2028-03-14", "2028-03-21", "2028-03-28", "2028-04-04",
    ]);
    assert.ok(schedule.every((visit) => visit.cents === 8000));
  });

  test("vai até o primeiro atendimento a partir de hoje + 224 dias", () => {
    const schedule = buildPackageSchedule(MENSAL, TODAY);
    const horizon = addDays(TODAY, SCHEDULE_HORIZON_DAYS);

    assert.ok(schedule.at(-2).date < horizon && schedule.at(-1).date >= horizon, schedule.at(-1).date);
  });

  test("início depois do horizonte: só o próprio início", () => {
    const schedule = buildPackageSchedule({ ...MENSAL, start: "2028-01-04" }, TODAY);

    assert.deepEqual(dates(schedule), ["2028-01-04"]);
  });

  test("valor zero dá atendimentos de zero", () => {
    assert.ok(buildPackageSchedule({ ...MENSAL, priceCents: 0 }, TODAY).every((visit) => visit.cents === 0));
  });
});

describe("agenda de um pet novo", () => {
  const clock = { today: TODAY, time: "12:00" };
  const autoOf = (time) => scheduleForNewPet(MENSAL, clock, time).map((visit) => [visit.date, visit.auto]);

  test("o que já passou entra como manual, e o resto como automático", () => {
    const [past, today, next] = autoOf("13:00");

    assert.deepEqual(past, ["2026-11-03", false]);
    assert.deepEqual(today, ["2026-11-10", true], "hoje, mais tarde");
    assert.deepEqual(next, ["2026-11-17", true]);
  });

  test("hoje, o horário que já passou entra como manual; o horário de agora ainda não passou", () => {
    assert.deepEqual(autoOf("10:00")[1], ["2026-11-10", false]);
    assert.deepEqual(autoOf("12:00")[1], ["2026-11-10", true]);
  });

  test("sem horário, o de hoje fica automático, como o trigger fazia", () => {
    assert.deepEqual(autoOf(null)[1], ["2026-11-10", true]);
  });

  test("o relógio é o do aparelho: a data e o horário locais", () => {
    assert.deepEqual(scheduleClockOf(new Date(2026, 10, 10, 9, 5)), { today: "2026-11-10", time: "09:05" });
    assert.deepEqual(scheduleClockOf(new Date(2026, 11, 31, 23, 59)), { today: "2026-12-31", time: "23:59" });
  });
});

describe("agenda refeita depois de uma edição", () => {
  test("só de hoje em diante, sem os dias com atendimento concluído, e com o valor da posição no mês", () => {
    const schedule = scheduleFromToday(MENSAL, TODAY, new Set(["2026-11-17", "2026-11-03"]));

    assert.deepEqual(dates(schedule).slice(0, 4), ["2026-11-10", "2026-11-24", "2026-12-01", "2026-12-08"]);
    assert.equal(schedule[1].cents, 2500, "24/11 continua o 4º do mês");
    assert.equal(schedule[2].cents, 2501);
  });
});

describe("quando a edição refaz a agenda", () => {
  const pet = {
    remarcacao_ativa: 1,
    pacote_remarcacao: 4,
    data_inicio_pacote: "2026-11-03",
    valor_pacote: 32000,
    horario_padrao: "10:00",
    servico_padrao: "Banho",
    is_ativo: 1,
    ultimo_visita_data_auto: "2027-06-22",
  };

  test("salvar sem mudar nada, ou mudar só o ponteiro, não refaz", () => {
    assert.equal(shouldRebuildSchedule(pet, { ...pet }), false);
    assert.equal(shouldRebuildSchedule(pet, { ...pet, ultimo_visita_data_auto: null }), false);
  });

  for (const [field, value] of [
    ["pacote_remarcacao", 2],
    ["data_inicio_pacote", "2026-11-05"],
    ["valor_pacote", 40000],
    ["horario_padrao", "16:00"],
    ["servico_padrao", "Banho e Tosa"],
  ]) {
    test(`mudar ${field} refaz`, () => {
      assert.equal(shouldRebuildSchedule(pet, { ...pet, [field]: value }), true);
    });
  }

  test("ligar o pacote ou reativar o pet refaz", () => {
    assert.equal(shouldRebuildSchedule({ ...pet, remarcacao_ativa: 0 }, pet), true);
    assert.equal(shouldRebuildSchedule({ ...pet, is_ativo: 0 }, pet), true);
  });

  test("com o pacote desligado, sem pacote ou com o pet inativo, nada é refeito", () => {
    assert.equal(shouldRebuildSchedule(pet, { ...pet, remarcacao_ativa: 0, valor_pacote: 1 }), false);
    assert.equal(shouldRebuildSchedule(pet, { ...pet, pacote_remarcacao: null }), false);
    assert.equal(shouldRebuildSchedule(pet, { ...pet, is_ativo: 0, valor_pacote: 1 }), false);
  });

  test("nulo e ausente valem o mesmo, e nulo para valor é mudança", () => {
    assert.equal(shouldRebuildSchedule({ ...pet, data_inicio_pacote: null }, { ...pet, data_inicio_pacote: undefined }), false);
    assert.equal(shouldRebuildSchedule(pet, { ...pet, valor_pacote: null }), true);
  });
});

describe("o pacote do pet", () => {
  test("sem a remarcação ligada ou sem pacote, não há agenda", () => {
    assert.equal(packagePlanOf({ remarcacao_ativa: 0, pacote_remarcacao: 4, is_ativo: 1 }, TODAY), null);
    assert.equal(packagePlanOf({ remarcacao_ativa: 1, pacote_remarcacao: null, is_ativo: 1 }, TODAY), null);
  });

  test("sem início, começa hoje; sem valor, vale zero", () => {
    assert.deepEqual(
      packagePlanOf({ remarcacao_ativa: 1, pacote_remarcacao: 2, data_inicio_pacote: null, valor_pacote: null, is_ativo: 1 }, TODAY),
      { visitsPerMonth: 2, start: TODAY, priceCents: 0 },
    );
  });
});

describe("conclusão de um automático", () => {
  test("só a passagem de pendente para concluído de um automático conta (BUG-3)", () => {
    assert.equal(isAutoVisitConclusion({ concluido: 0 }, { concluido: 1, is_auto_agen: 1 }), true);
    assert.equal(isAutoVisitConclusion({ concluido: 1 }, { concluido: 1, is_auto_agen: 1 }), false, "salvar de novo");
    assert.equal(isAutoVisitConclusion({ concluido: 0 }, { concluido: 1, is_auto_agen: 0 }), false, "manual");
    assert.equal(isAutoVisitConclusion({ concluido: 0 }, { concluido: 0, is_auto_agen: 1 }), false, "sem concluir");
  });

  test("com saldo no mês do último da agenda, soma o intervalo do pacote, inclusive na virada do ano", () => {
    const next = { concludedDate: "2026-11-10", pendingInLastScheduledMonth: 3 };

    assert.equal(nextPackageVisitDate({ ...next, lastScheduled: "2026-12-29", visitsPerMonth: 4 }), "2027-01-05");
    assert.equal(nextPackageVisitDate({ ...next, lastScheduled: "2027-02-20", visitsPerMonth: 2, pendingInLastScheduledMonth: 1 }), "2027-03-06");
  });

  test("com o mês cheio, pula para o mês seguinte no dia da semana do concluído", () => {
    // 12/11/2026 é quinta; a primeira quinta de janeiro de 2027 é dia 7.
    const date = nextPackageVisitDate({
      lastScheduled: "2026-12-22",
      concludedDate: "2026-11-12",
      visitsPerMonth: 4,
      pendingInLastScheduledMonth: 4,
    });

    assert.equal(date, "2027-01-07");
  });

  test("o valor do atendimento segue a posição dele no mês", () => {
    assert.deepEqual([1, 2, 3, 4].map((position) => visitCents(10003, 4, position)), [2501, 2501, 2501, 2500]);
    assert.deepEqual([1, 2].map((position) => visitCents(20001, 2, position)), [10001, 10000]);
    assert.equal(visitCents(32000, 4, 5), 8000, "um 5º no mês fica sem sobra");
  });
});
