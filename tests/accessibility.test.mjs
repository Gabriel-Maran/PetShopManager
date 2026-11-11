// Acessibilidade (A11Y-1): o contraste de cada texto com o fundo em que ele aparece, nos dois temas, a
// área de toque mínima dos botões e os rótulos que o leitor de tela fala.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { THEME_COLORS } from "../src/view/theme/colors.ts";
import { TINT_OPACITY, withAlpha } from "../src/view/theme/alpha.ts";
import {
  HIDDEN_FROM_SCREEN_READER,
  MIN_TOUCH_TARGET,
  touchTargetSlop,
} from "../src/view/components/accessibility/accessibilityProps.ts";
import { A11Y_LABELS } from "../src/globals/accessibilityLabels.ts";

/** Os canais de uma cor "#RRGGBB" ou "rgb(r, g, b)", de 0 a 255. */
function parseColor(color) {
  const hex = color.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((start) => parseInt(hex[1].slice(start, start + 2), 16));
  const rgb = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (rgb) return rgb.slice(1).map(Number);
  throw new Error(`Cor em formato não suportado: ${color}`);
}

/** Luminância relativa, pela fórmula da WCAG 2.1. */
function luminance(color) {
  const [r, g, b] = parseColor(color).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste entre duas cores, de 1 a 21. A ordem não importa. */
function contrastRatio(first, second) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

/** A cor que aparece quando `color` com opacidade `alpha` (0 a 1) fica por cima de `background`. */
function overlay(color, alpha, background) {
  const top = parseColor(color);
  const bottom = parseColor(background);
  const mixed = top.map((channel, i) => Math.round(channel * alpha + bottom[i] * (1 - alpha)));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/** A cor que aparece quando uma cor "rgba(r, g, b, a)", como a do `withAlpha`, fica sobre `background`. */
function flatten(rgba, background) {
  const match = rgba.match(/^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/);
  if (!match) throw new Error(`Cor em formato não suportado: ${rgba}`);
  const [red, green, blue, alpha] = match.slice(1).map(Number);
  return overlay(`rgb(${red}, ${green}, ${blue})`, alpha, background);
}

// Texto comum precisa de 4,5:1 (WCAG 2.1, critério 1.4.3).
const MIN_TEXT_CONTRAST = 4.5;

// Cada par é [cor do texto, cor do fundo, onde aparece]. Um par novo nas telas entra aqui.
const TEXT_PAIRS = [
  ["TEXT_PRIMARY", "BACKGROUND", "títulos e textos principais"],
  ["TEXT_SECONDARY", "BACKGROUND", "dias do calendário"],
  ["TEXT_MUTED", "BACKGROUND", "textos de apoio e abas inativas da barra"],
  ["TEXT_MUTED", "THIRD_BACKGROUND", "subtítulos de Relatórios e Configurações"],
  ["TEXT_MUTED", "SURFACE", "rótulos dos gráficos"],
  ["TEXT_MUTED", "SURFACE_VARIANT", "aviso do backup"],
  ["TEXT_MUTED", "EDIT_BACKGROUND_COLOR", "descrição do cartão de exportar"],
  ["TEXT_MUTED", "DEACTIVATE_BACKGROUND_COLOR", "descrição do cartão de importar"],
  ["TEXT_PLACEHOLDER", "BACKGROUND", "texto de exemplo dos campos"],
  ["PRIMARY", "BACKGROUND", "aba ativa da barra e serviço na agenda"],
  ["PRIMARY_VARIANT", "BACKGROUND", "textos verdes dos formulários"],
  ["PRIMARY_CONTRAST", "BACKGROUND", "dia de hoje no calendário"],
  ["BACKGROUND", "PRIMARY", "aba escolhida e botão Cadastrar da raça"],
  ["BACKGROUND", "PRIMARY_VARIANT", "botões Salvar, OK e Confirmar, e a página atual"],
  ["BACKGROUND", "PRIMARY_CONTRAST", "Confirmar do calendário e número do dia de hoje"],
  ["EDIT_MAIN_COLOR", "EDIT_BACKGROUND_COLOR", "Exportar dados e Carregar dados de exemplo"],
  ["DEACTIVATE_MAIN_COLOR", "DEACTIVATE_BACKGROUND_COLOR", "Importar dados"],
  ["DEACTIVATE_MAIN_COLOR", "BACKGROUND", "nome no aviso de desativar"],
  ["BACKGROUND", "DEACTIVATE_MAIN_COLOR", "botão Desativar"],
  ["BACKGROUND", "RED_COLOR", "botão de confirmar ação destrutiva"],
  ["BACKGROUND", "TEXT_SECONDARY", "botão Cancelar do aviso de desativar"],
  ["RED_COLOR", "BACKGROUND", "erro do campo de data"],
  ["CHART_TEXT_HIGHLIGHT", "SURFACE", "maior valor do gráfico"],
];

// O que não é texto, como o trilho do interruptor e o ✕, precisa de 3:1 (WCAG 2.1, critério 1.4.11).
const MIN_NON_TEXT_CONTRAST = 3;

// Cada par é [cor do componente, cor do fundo, onde aparece].
const NON_TEXT_PAIRS = [
  ["DISABLED", "BACKGROUND", "trilho do interruptor desligado"],
  ["PRIMARY", "BACKGROUND", "trilho do interruptor ligado"],
  ["PRIMARY", "PRIMARY_SOFT", "✕ do Fechar dos modais"],
  ["TOGGLE_THUMB", "PRIMARY", "bolinha do interruptor ligado"],
  ["TOGGLE_THUMB", "DISABLED", "bolinha do interruptor desligado"],
];

// Fundos feitos com a própria cor do texto em transparência, pelo `withAlpha`:
// [texto, opacidade de TINT_OPACITY, fundo, onde aparece].
const TINTED_PAIRS = [
  ["PRIMARY_CONTRAST", "SELECTED_DATE", "BACKGROUND", "data escolhida no calendário"],
  ["GREEN_COLOR", "ACTIVE_FILTER", "THIRD_BACKGROUND", "opção Ativos do filtro"],
  ["RED_COLOR", "ACTIVE_FILTER", "THIRD_BACKGROUND", "opção Inativos do filtro"],
];

describe("cálculo de contraste", () => {
  test("preto e branco dão 21:1, e a ordem das cores não muda o resultado", () => {
    assert.equal(contrastRatio("#000000", "#ffffff"), 21);
    assert.equal(contrastRatio("#ffffff", "#000000"), 21);
  });

  test("a mesma cor dá 1:1", () => {
    assert.equal(contrastRatio("#1D9E75", "#1D9E75"), 1);
  });

  test("o cinza #767676 é o mais claro que passa de 4,5:1 sobre o branco", () => {
    assert.ok(contrastRatio("#767676", "#ffffff") >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio("#777777", "#ffffff") < MIN_TEXT_CONTRAST);
  });

  test("o verde antigo dos botões, com texto branco, ficava abaixo de 4,5:1", () => {
    assert.equal(contrastRatio("#ffffff", "#1D9E75").toFixed(2), "3.39");
  });

  test("aceita cor em rgb()", () => {
    assert.equal(contrastRatio("rgb(0, 0, 0)", "#ffffff"), 21);
  });

  test("uma cor em formato desconhecido falha em vez de passar calada", () => {
    assert.throws(() => contrastRatio("red", "#ffffff"), /formato não suportado/);
  });

  test("a transparência mistura as cores pela opacidade", () => {
    assert.equal(overlay("#000000", 0.5, "#ffffff"), "#808080");
    assert.equal(overlay("#123456", 1, "#ffffff"), "#123456");
    assert.equal(overlay("#123456", 0, "#ffffff"), "#ffffff");
    assert.equal(flatten("rgba(0, 0, 0, 0.5)", "#ffffff"), "#808080");
  });
});

describe("withAlpha", () => {
  test("põe a opacidade numa cor #RRGGBB, sem importar maiúsculas", () => {
    assert.equal(withAlpha("#0B7377", 0.13), "rgba(11, 115, 119, 0.13)");
    assert.equal(withAlpha("#ffffff", 0.5), withAlpha("#FFFFFF", 0.5));
  });

  test("aceita #RGB e rgb(r, g, b)", () => {
    assert.equal(withAlpha("#0f8", 0.2), "rgba(0, 255, 136, 0.2)");
    assert.equal(withAlpha("rgb(203, 31, 31)", 0.1), "rgba(203, 31, 31, 0.1)");
  });

  test("aceita as opacidades 0 e 1, os limites", () => {
    assert.equal(withAlpha("#000000", 0), "rgba(0, 0, 0, 0)");
    assert.equal(withAlpha("#000000", 1), "rgba(0, 0, 0, 1)");
  });

  test("funciona com todas as cores hex dos dois temas", () => {
    for (const colors of Object.values(THEME_COLORS)) {
      for (const color of Object.values(colors).filter((value) => value.startsWith("#"))) {
        assert.doesNotThrow(() => withAlpha(color, 0.5), color);
      }
    }
  });

  test("falha com cor em formato que não sabe ler, em vez de devolver outra cor", () => {
    for (const color of ["", "red", "#12345", "#1234567", "#12345678", "#GGGGGG", "rgb(256, 0, 0)", "rgba(0, 0, 0, 0.5)"]) {
      assert.throws(() => withAlpha(color, 0.5), /formato não suportado/, color);
    }
  });

  test("falha com opacidade fora de 0 a 1 ou que não é número finito", () => {
    for (const opacity of [-0.1, 1.1, 34, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.throws(() => withAlpha("#000000", opacity), /opacidade fora de 0 a 1/, String(opacity));
    }
  });
});

for (const [themeName, colors] of Object.entries(THEME_COLORS)) {
  describe(`contraste do tema ${themeName === "light" ? "claro" : "escuro"}`, () => {
    for (const [text, background, where] of TEXT_PAIRS) {
      test(`${text} sobre ${background} (${where})`, () => {
        const ratio = contrastRatio(colors[text], colors[background]);
        assert.ok(
          ratio >= MIN_TEXT_CONTRAST,
          `${colors[text]} sobre ${colors[background]} dá ${ratio.toFixed(2)}:1`,
        );
      });
    }

    for (const [component, background, where] of NON_TEXT_PAIRS) {
      test(`${component} sobre ${background} (${where})`, () => {
        const ratio = contrastRatio(colors[component], colors[background]);
        assert.ok(
          ratio >= MIN_NON_TEXT_CONTRAST,
          `${colors[component]} sobre ${colors[background]} dá ${ratio.toFixed(2)}:1`,
        );
      });
    }

    for (const [text, opacity, background, where] of TINTED_PAIRS) {
      test(`${text} sobre ele mesmo em transparência (${where})`, () => {
        const tinted = flatten(withAlpha(colors[text], TINT_OPACITY[opacity]), colors[background]);
        const ratio = contrastRatio(colors[text], tinted);
        assert.ok(
          ratio >= MIN_TEXT_CONTRAST,
          `${colors[text]} sobre ${tinted} dá ${ratio.toFixed(2)}:1`,
        );
      });
    }
  });
}

describe("temas", () => {
  test("os dois temas têm as mesmas cores, para nenhuma tela ficar sem cor ao trocar", () => {
    assert.deepEqual(
      Object.keys(THEME_COLORS.dark).sort(),
      Object.keys(THEME_COLORS.light).sort(),
    );
  });
});

describe("área de toque", () => {
  test("um botão de 38 dp ganha 5 dp de cada lado e chega a 48 dp", () => {
    const slop = touchTargetSlop({ width: 38, height: 38 });
    assert.deepEqual(slop, { top: 5, bottom: 5, left: 5, right: 5 });
    assert.equal(38 + slop.left + slop.right, MIN_TOUCH_TARGET);
  });

  test("só o lado menor que 48 dp ganha acréscimo", () => {
    assert.deepEqual(touchTargetSlop({ width: 50, height: 30 }), {
      top: 9,
      bottom: 9,
      left: 0,
      right: 0,
    });
  });

  test("sem tamanho informado, o lado conta como já tendo 48 dp", () => {
    assert.deepEqual(touchTargetSlop({ height: 40 }), { top: 4, bottom: 4, left: 0, right: 0 });
  });

  test("um botão de 48 dp ou maior fica como está", () => {
    assert.deepEqual(touchTargetSlop({ width: 65, height: 65 }), {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    });
  });
});

describe("leitor de tela", () => {
  test("o que é só enfeite fica fora do leitor no Android e no iOS", () => {
    assert.deepEqual(HIDDEN_FROM_SCREEN_READER, {
      accessible: false,
      importantForAccessibility: "no-hide-descendants",
      accessibilityElementsHidden: true,
    });
  });

  test("os botões das listas falam a ação e o nome do registro", () => {
    assert.equal(A11Y_LABELS.registry.edit("Rex"), "Editar Rex");
    assert.equal(A11Y_LABELS.registry.deactivate("Rex"), "Desativar Rex");
    assert.equal(A11Y_LABELS.registry.activate("Ana"), "Reativar Ana");
  });

  test("o interruptor junta o título e a pergunta, e fica só com o título sem pergunta", () => {
    assert.equal(A11Y_LABELS.toggle("Pagamento", "Cliente pagou?"), "Pagamento: Cliente pagou?");
    assert.equal(A11Y_LABELS.toggle("Remarcação automática ativa", ""), "Remarcação automática ativa");
    assert.equal(A11Y_LABELS.toggle("Status"), "Status");
  });

  test("trocar a seleção lê o campo em minúsculas, mesmo vindo em maiúsculas", () => {
    assert.equal(A11Y_LABELS.changeSelection("PET"), "Trocar pet");
    assert.equal(A11Y_LABELS.changeSelection("Dono"), "Trocar dono");
  });

  test("o agendamento concluído diz que está concluído, já que o risco só aparece na tela", () => {
    const appointment = { pet: "Rex", owner: "Ana", service: "Banho", time: "10:00" };
    assert.equal(
      A11Y_LABELS.appointments.item({ ...appointment, done: false }),
      "Rex, de Ana, Banho às 10:00",
    );
    assert.equal(
      A11Y_LABELS.appointments.item({ ...appointment, done: true }),
      "Rex, de Ana, Banho às 10:00, concluído",
    );
  });

  test("a paginação fala o número da página contando de 1", () => {
    assert.equal(A11Y_LABELS.pagination.page(1), "Página 1");
  });

  test("nenhum rótulo fixo fica vazio", () => {
    const fixedLabels = (group, path = "A11Y_LABELS") =>
      Object.entries(group).flatMap(([key, value]) => {
        const keyPath = `${path}.${key}`;
        if (typeof value === "string") return [[keyPath, value]];
        if (typeof value === "function") return [];
        return fixedLabels(value, keyPath);
      });
    for (const [path, label] of fixedLabels(A11Y_LABELS)) {
      assert.ok(label.trim().length > 0, `${path} está vazio`);
    }
  });
});
