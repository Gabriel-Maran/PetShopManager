// Caracterização das funções de data, máscara, formatação e normalização usadas nas telas.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  brToDb,
  dbToBr,
  dbToIso,
  isoToBr,
  isoToDb,
  todayDb,
  todayIso,
} from "../app/utils/datas.ts";
import { formatValue } from "../app/utils/formatadores/formaterHelper.ts";
import { normalizeForSearch } from "../app/utils/formatadores/normalizaNome.ts";
import { mascararHorario } from "../app/utils/mascarar.ts";
import {
  centsToMoney,
  maskMoneyInput,
  moneyToCents,
  normalizeMoney,
} from "../app/utils/dinheiro.ts";

/** Roda o teste com o fuso do processo trocado, como se o aparelho estivesse nesse fuso. */
function withTimeZone(timeZone, run) {
  const previous = process.env.TZ;
  process.env.TZ = timeZone;
  try {
    run();
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
}

describe("datas", () => {
  test("convertem entre o número do banco e os textos das telas", () => {
    assert.equal(dbToBr(20261108), "08/11/2026");
    assert.equal(dbToIso(20261108), "2026-11-08");
    assert.equal(isoToBr("2026-11-08"), "08/11/2026");
  });

  test("voltam para o número do banco com barra ou com hífen", () => {
    assert.equal(brToDb("08/11/2026"), 20261108);
    assert.equal(isoToDb("2026-11-08"), 20261108);
  });

  test("BUG-7: às 22h em Brasília, hoje ainda é o mesmo dia, e não o de amanhã em UTC", () => {
    withTimeZone("America/Sao_Paulo", () => {
      const twentyTwoHours = new Date("2026-11-08T22:30:00-03:00");

      assert.equal(twentyTwoHours.toISOString().slice(0, 10), "2026-11-09", "em UTC já é amanhã");
      assert.equal(todayIso(twentyTwoHours), "2026-11-08");
      assert.equal(todayDb(twentyTwoHours), 20261108);
    });
  });

  test("hoje segue o fuso do aparelho, não um fuso fixo", () => {
    const instant = new Date("2026-11-09T02:30:00Z");

    withTimeZone("America/Manaus", () => assert.equal(todayIso(instant), "2026-11-08"));
    withTimeZone("Europe/Lisbon", () => assert.equal(todayIso(instant), "2026-11-09"));
  });

  test("dias e meses de um dígito saem com zero à esquerda", () => {
    withTimeZone("America/Sao_Paulo", () => {
      assert.equal(todayIso(new Date(2026, 0, 5, 12)), "2026-01-05");
    });
  });
});

describe("máscara de horário", () => {
  for (const [entrada, saida] of [
    ["", ""],
    ["9", "9"],
    ["09", "09"],
    ["093", "09:3"],
    ["0930", "09:30"],
    ["09:30", "09:30"],
    ["2560", "23:59"],
    ["99", "23"],
    ["ab12", "12"],
    // Com mais de quatro dígitos, o campo hoje fica vazio, em vez de ignorar o dígito a mais.
    ["09300", ""],
  ]) {
    test(`${JSON.stringify(entrada)} vira ${JSON.stringify(saida)}`, () => {
      assert.equal(mascararHorario(entrada), saida);
    });
  }
});

describe("dinheiro: máscara de digitação", () => {
  for (const [entrada, saida] of [
    ["120", "120"],
    ["120,5", "120,5"],
    ["120,567", "120,56"],
    ["1,2,3", "1,23"],
    ["R$ 80,00", "80,00"],
    [",", ","],
    ["", ""],
  ]) {
    test(`${JSON.stringify(entrada)} vira ${JSON.stringify(saida)}`, () => {
      assert.equal(maskMoneyInput(entrada), saida);
    });
  }
});

describe("dinheiro: centavos", () => {
  for (const [entrada, centavos] of [
    ["12,50", 1250],
    ["12,5", 1250],
    ["12", 1200],
    ["0,07", 7],
    [" 99,99 ", 9999],
    ["0", 0],
  ]) {
    test(`${JSON.stringify(entrada)} vale ${centavos} centavos`, () => {
      assert.equal(moneyToCents(entrada), centavos);
    });
  }

  for (const entrada of ["", "   ", ",", ",50", "12,", "12,345", "1.234,56", "12.50", "-5", "abc", null, undefined]) {
    test(`${JSON.stringify(entrada)} não é um valor`, () => {
      assert.equal(moneyToCents(entrada), null);
    });
  }

  test("centavos voltam para o texto das telas, sempre com duas casas", () => {
    assert.equal(centsToMoney(1250), "12,50");
    assert.equal(centsToMoney(7), "0,07");
    assert.equal(centsToMoney(0), "0,00");
    assert.equal(centsToMoney(123456), "1234,56");
  });

  test("o valor digitado vai para o banco no mesmo formato", () => {
    assert.equal(normalizeMoney("12,5"), "12,50");
    assert.equal(normalizeMoney("80"), "80,00");
    assert.equal(normalizeMoney("80,00"), "80,00");
    assert.equal(normalizeMoney(","), null);
    assert.equal(normalizeMoney(""), null);
  });

  test("ida e volta não muda nenhum valor de 0,00 a 99,99", () => {
    for (let cents = 0; cents < 10_000; cents++) {
      assert.equal(moneyToCents(centsToMoney(cents)), cents);
    }
  });
});

describe("números dos gráficos", () => {
  test("inteiros ficam como estão, frações com uma casa e milhares em k", () => {
    assert.equal(formatValue(12), "12");
    assert.equal(formatValue(12.34), "12,3");
    assert.equal(formatValue(1500), "1,5k");
  });
});

describe("normalização para a busca", () => {
  test("tira acentos, espaços das pontas e maiúsculas", () => {
    assert.equal(normalizeForSearch("  João Ávila "), "joao avila");
    assert.equal(normalizeForSearch("Cléo"), "cleo");
  });
});
