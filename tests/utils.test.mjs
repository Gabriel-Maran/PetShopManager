// Caracterização das funções de data, máscara, formatação e normalização usadas nas telas.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { hifen_para_br, hoje, intParaHifen } from "../app/utils/dataPicker/dataPickerAux.ts";
import {
  DataHifenPraBarra,
  DataNumberPraString,
  DataNumberPraStringHifen,
  DataStringPraNumber,
} from "../app/utils/formatadores/converterData.ts";
import { formatValue } from "../app/utils/formatadores/formaterHelper.ts";
import { normalizeForSearch } from "../app/utils/formatadores/normalizaNome.ts";
import { mascararHorario, numeroComVirgula } from "../app/utils/mascarar.ts";

describe("datas", () => {
  test("convertem entre o número do banco e os textos das telas", () => {
    assert.equal(DataNumberPraString(20261108), "08/11/2026");
    assert.equal(DataNumberPraStringHifen(20261108), "2026-11-08");
    assert.equal(intParaHifen(20261108), "2026-11-08");
    assert.equal(intParaHifen("20261108"), "2026-11-08");
    assert.equal(hifen_para_br("2026-11-08"), "08/11/2026");
    assert.equal(DataHifenPraBarra("2026-11-08"), "08/11/2026");
  });

  test("voltam para o número do banco com barra ou com hífen", () => {
    assert.equal(DataStringPraNumber("08/11/2026", "/"), 20261108);
    assert.equal(DataStringPraNumber("2026-11-08", "-"), 20261108);
  });

  test("hoje sai no formato YYYY-MM-DD, pelo fuso de São Paulo", () => {
    assert.match(hoje(), /^\d{4}-\d{2}-\d{2}$/);
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

describe("valor com vírgula", () => {
  for (const [entrada, saida] of [
    ["120", "120"],
    ["120,5", "120,5"],
    ["120,567", "120,56"],
    ["1,2,3", "1,23"],
    ["R$ 80,00", "80,00"],
    ["", ""],
  ]) {
    test(`${JSON.stringify(entrada)} vira ${JSON.stringify(saida)}`, () => {
      assert.equal(numeroComVirgula(entrada), saida);
    });
  }
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
