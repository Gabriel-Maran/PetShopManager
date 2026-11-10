// Caracterização das funções de data, máscara, formatação e normalização usadas nas telas.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { dateToIso, isIsoDate, isoToBr, todayIso } from "../src/utils/datas.ts";
import { formatValue } from "../src/utils/formatadores/formaterHelper.ts";
import { normalizeForSearch } from "../src/utils/formatadores/normalizaNome.ts";
import { mascararHorario } from "../src/utils/mascarar.ts";
import {
  centsToMoney,
  formatMoneyInput,
  isValidCents,
  maskMoneyInput,
  moneyToCents,
  parseMoneyInput,
} from "../src/utils/dinheiro.ts";
import { MESSAGES } from "../src/globals/messages.ts";
import { AppError } from "../src/errors/AppError.ts";

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
  test("o texto do banco vira o texto das telas", () => {
    assert.equal(isoToBr("2026-11-08"), "08/11/2026");
  });

  test("um Date vira o dia dele no fuso do aparelho", () => {
    withTimeZone("America/Sao_Paulo", () => {
      assert.equal(dateToIso(new Date(2026, 1, 28, 23, 59)), "2026-02-28");
      // O dia 0 do mês seguinte é o último dia do mês, como o calendário usa.
      assert.equal(dateToIso(new Date(2028, 2, 0)), "2028-02-29");
    });
  });

  test("só AAAA-MM-DD passa como data do banco", () => {
    assert.equal(isIsoDate("2026-11-08"), true);
    for (const entrada of ["", "08/11/2026", "20261108", 20261108, "2026-11-8", " 2026-11-08", null, undefined]) {
      assert.equal(isIsoDate(entrada), false, JSON.stringify(entrada));
    }
  });

  test("só passa um dia que existe no calendário, com o 29 de fevereiro dos anos bissextos", () => {
    for (const entrada of ["2024-02-29", "2000-02-29", "2026-01-31", "2026-04-30", "2026-12-31"]) {
      assert.equal(isIsoDate(entrada), true, entrada);
    }
    for (const entrada of ["2025-02-29", "1900-02-29", "2026-02-30", "2026-04-31", "2026-13-01", "2026-00-10", "2026-01-00", "2026-01-32"]) {
      assert.equal(isIsoDate(entrada), false, entrada);
    }
  });

  test("a data é conferida pelo texto, e o fuso do aparelho não muda a resposta", () => {
    for (const zone of ["America/Sao_Paulo", "Pacific/Kiritimati", "Pacific/Pago_Pago", "UTC"]) {
      withTimeZone(zone, () => {
        assert.equal(isIsoDate("2024-02-29"), true, zone);
        assert.equal(isIsoDate("2026-03-01"), true, zone);
        assert.equal(isIsoDate("2026-02-29"), false, zone);
      });
    }
  });

  test("entrada maliciosa ou fora do tipo não passa como data", () => {
    for (const entrada of ["2026-11-08'; DROP TABLE pets; --", "2026-11-08\n", "２０２６-11-08", "9999-99-99", { toString: () => "2026-11-08" }, ["2026-11-08"]]) {
      assert.equal(isIsoDate(entrada), false, String(entrada));
    }
  });

  test("BUG-7: às 22h em Brasília, hoje ainda é o mesmo dia, e não o de amanhã em UTC", () => {
    withTimeZone("America/Sao_Paulo", () => {
      const twentyTwoHours = new Date("2026-11-08T22:30:00-03:00");

      assert.equal(twentyTwoHours.toISOString().slice(0, 10), "2026-11-09", "em UTC já é amanhã");
      assert.equal(todayIso(twentyTwoHours), "2026-11-08");
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

  test("ida e volta não muda nenhum valor de 0,00 a 99,99", () => {
    for (let cents = 0; cents < 10_000; cents++) {
      assert.equal(moneyToCents(centsToMoney(cents)), cents);
    }
  });
});

describe("dinheiro: campos dos formulários", () => {
  test("o valor digitado vira centavos para o banco", () => {
    assert.equal(parseMoneyInput("12,5"), 1250);
    assert.equal(parseMoneyInput("80"), 8000);
    assert.equal(parseMoneyInput("0,00"), 0);
  });

  test("campo vazio fica sem valor", () => {
    for (const entrada of ["", "   ", null, undefined]) {
      assert.equal(parseMoneyInput(entrada), null, JSON.stringify(entrada));
    }
  });

  test("valor fora do formato vira a mensagem para o usuário", () => {
    for (const entrada of [",", "12,", "12,345", "-5", "abc"]) {
      assert.throws(
        () => parseMoneyInput(entrada),
        (error) => error instanceof AppError && error.code === "VALIDATION" && error.message === MESSAGES.money.invalid,
        JSON.stringify(entrada),
      );
    }
  });

  test("os centavos do banco voltam para o campo com duas casas, e sem valor o campo fica vazio", () => {
    assert.equal(formatMoneyInput(1250), "12,50");
    assert.equal(formatMoneyInput(0), "0,00");
    assert.equal(formatMoneyInput(null), "");
    assert.equal(formatMoneyInput(undefined), "");
  });

  test("os controllers só aceitam centavos inteiros e sem sinal", () => {
    for (const valor of [0, 1, 1250, 10_000_000]) assert.equal(isValidCents(valor), true, String(valor));
    for (const valor of [-1, 12.5, Number.NaN, Number.POSITIVE_INFINITY, "1250", null, undefined]) {
      assert.equal(isValidCents(valor), false, String(valor));
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
