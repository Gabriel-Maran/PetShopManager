// Tema (TEMA-1): os tokens de layout e tipografia e a trava que impede cor e medida solta nas telas.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FONT_SIZE,
  FONT_WEIGHT,
  LETTER_SPACINGS,
  LINE_HEIGHTS,
  RADIUS,
  SPACING,
} from "../src/view/Themes/tokens.ts";
import { THEME_COLORS } from "../src/view/Themes/colors.ts";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

describe("tokens do tema", () => {
  test("nas escalas numéricas, a chave é o próprio valor, para o token nunca mentir", () => {
    for (const scale of [SPACING, LINE_HEIGHTS]) {
      for (const [key, value] of Object.entries(scale)) assert.equal(String(value), key);
    }
    for (const [key, value] of Object.entries(RADIUS)) {
      if (key !== "PILL") assert.equal(String(value), key);
    }
  });

  test("nenhuma escala repete valor: dois nomes para a mesma medida são dívida", () => {
    for (const scale of [SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, LINE_HEIGHTS, LETTER_SPACINGS]) {
      const values = Object.values(scale);
      assert.equal(new Set(values).size, values.length);
    }
  });

  test("o tamanho do texto cresce na ordem em que os nomes foram declarados", () => {
    const sizes = Object.values(FONT_SIZE);
    assert.deepEqual(sizes, [...sizes].sort((a, b) => a - b));
  });

  test("o peso do texto vai como texto, que é o que o React Native aceita", () => {
    for (const weight of Object.values(FONT_WEIGHT)) assert.equal(typeof weight, "string");
  });

  test("os dois temas têm a cor transparente", () => {
    for (const colors of Object.values(THEME_COLORS)) assert.equal(colors.TRANSPARENT, "transparent");
  });
});

/** Os arquivos .ts e .tsx de uma pasta, de forma recursiva. */
function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

/** O código sem os comentários, com as linhas no lugar, para o número da linha do erro bater. */
function withoutComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'])\/\/.*$/gm, "$1");
}

const FORBIDDEN_LITERALS = [
  ["cor hexadecimal", /#[0-9a-fA-F]{3,8}\b/],
  ["cor rgb ou rgba", /\brgba?\(/],
  [
    "nome de cor",
    /["'](?:white|black|red|green|blue|gray|grey|yellow|orange|purple|pink|transparent)["']/,
  ],
  ["tamanho de fonte", /\b(?:fontSize|text(?:Month|Day|DayHeader)FontSize)\s*:\s*\d/],
  ["peso de fonte", /\b(?:fontWeight|text(?:Month|Day|DayHeader)FontWeight)\s*:\s*["'\d]/],
  ["altura de linha", /\blineHeight\s*:\s*\d/],
  ["espaço entre letras", /\bletterSpacing\s*:\s*-?\d/],
  [
    "espaço (padding, margin ou gap)",
    /\b(?:(?:padding|margin)(?:Vertical|Horizontal|Top|Bottom|Left|Right|Start|End)?|gap|rowGap|columnGap)\s*:\s*[1-9]/,
  ],
  ["raio de canto", /\bborder(?:(?:Top|Bottom)(?:Left|Right|Start|End))?Radius\s*:\s*[1-9]/],
];

describe("telas sem valor de tema solto", () => {
  const folders = ["src/view", "src/utils/relatorios"].map((folder) => join(repoRoot, folder));
  const themeFolder = join(repoRoot, "src", "view", "Themes");
  const screenFiles = folders
    .flatMap(sourceFiles)
    .filter((file) => !file.startsWith(themeFolder + sep));

  test("a busca encontra os arquivos das telas", () => {
    assert.ok(screenFiles.length > 40, `só ${screenFiles.length} arquivos achados`);
  });

  for (const [name, pattern] of FORBIDDEN_LITERALS) {
    test(`nenhum(a) ${name} fora de src/view/Themes`, () => {
      const found = screenFiles.flatMap((file) =>
        withoutComments(readFileSync(file, "utf8"))
          .split("\n")
          .flatMap((line, index) =>
            pattern.test(line) ? [`${relative(repoRoot, file)}:${index + 1}: ${line.trim()}`] : [],
          ),
      );
      assert.deepEqual(found, [], "use os tokens de src/view/Themes");
    });
  }
});
