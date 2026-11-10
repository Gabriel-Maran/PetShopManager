// Tokens de layout e tipografia que não mudam entre o tema claro e o escuro (TEMA-1). As cores ficam em
// `colors.ts`, e a transparência, em `alpha.ts`. Sem depender do React Native, para os testes rodarem no Node.
//
// Cada token guarda exatamente o valor que as telas já usavam, em dp (ou sp, nos textos). Valores
// próximos, como 15 e 16, continuam separados de propósito: juntá-los muda a tela e é decisão de
// design, feita aqui, em um lugar só. A tabela de tipos impede usar um valor que não está na escala.

/**
 * Espaço de `padding`, `margin` e `gap`. A chave é o valor em dp, para a escala poder crescer sem
 * renomear nada. O 0 não tem token: é "sem espaço", e não uma medida.
 */
export const SPACING = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  10: 10,
  11: 11,
  12: 12,
  /** Ajuste fino do ícone do campo aberto; candidato a virar 12. */
  12.1: 12.1,
  13: 13,
  14: 14,
  15: 15,
  16: 16,
  18: 18,
  20: 20,
  24: 24,
  25: 25,
  28: 28,
  30: 30,
  32: 32,
  36: 36,
  40: 40,
  /** A folga lateral do botão de salvar, que o deixa largo no meio da tela. */
  75: 75,
} as const;

/** Raio dos cantos, em dp. O 0 (canto reto) não tem token. */
export const RADIUS = {
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  10: 10,
  12: 12,
  13: 13,
  14: 14,
  15: 15,
  16: 16,
  20: 20,
  22: 22,
  /** Cápsula e círculo: maior que qualquer metade de lado, então o canto sempre fecha. */
  PILL: 99,
} as const;

/** Tamanho do texto, em sp. Os nomes seguem a escada de títulos e corpo do app, do menor ao maior. */
export const FONT_SIZE = {
  /** Rótulos de seção em caixa alta. */
  OVERLINE: 10,
  CAPTION: 11,
  SMALL: 12,
  BODY_SMALL: 13,
  BODY: 14,
  BODY_LARGE: 15,
  SUBTITLE: 16,
  SUBTITLE_LARGE: 17,
  TITLE_SMALL: 18,
  TITLE: 20,
  /** Também o tamanho dos ícones feitos de texto (setas e chevrons). */
  TITLE_LARGE: 22,
  HEADLINE: 26,
  /** O emoji grande dos modais. */
  DISPLAY: 40,
} as const;

/** Peso do texto. O RN exige texto, e "bold" é o mesmo que "700". */
export const FONT_WEIGHT = {
  LIGHT: "300",
  MEDIUM: "500",
  SEMIBOLD: "600",
  BOLD: "700",
} as const;

/** Altura de linha do texto, em sp. A chave é o valor. */
export const LINE_HEIGHTS = {
  15: 15,
  17: 17,
  18: 18,
  20: 20,
  22: 22,
  24: 24,
} as const;

/** Espaçamento entre as letras, nos rótulos em caixa alta e nos títulos. */
export const LETTER_SPACINGS = {
  TIGHT: -0.5,
  SLIGHT: 0.5,
  LABEL_SM: 1.1,
  LABEL: 1.2,
  LABEL_LG: 1.3,
} as const;
