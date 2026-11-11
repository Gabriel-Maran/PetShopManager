// Transparência sobre as cores do tema. Sem depender do React Native, para os testes rodarem no Node.

/** As opacidades dos fundos feitos com a própria cor do texto; o teste de contraste confere cada uma. */
export const TINT_OPACITY = {
  /** A data escolhida no calendário. */
  SELECTED_DATE: 0.13,
  /** A opção escolhida no painel de filtros. */
  ACTIVE_FILTER: 0.06,
} as const;

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB_COLOR = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;

/** Os canais de uma cor "#RGB", "#RRGGBB" ou "rgb(r, g, b)", de 0 a 255, ou `null` se o formato não servir. */
function parseChannels(color: string): [number, number, number] | null {
  const hex = HEX_COLOR.exec(color.trim());
  if (hex) {
    const digits =
      hex[1].length === 3
        ? hex[1].split("").map((digit) => digit + digit)
        : [hex[1].slice(0, 2), hex[1].slice(2, 4), hex[1].slice(4, 6)];
    const [red, green, blue] = digits.map((pair) => parseInt(pair, 16));
    return [red, green, blue];
  }

  const rgb = RGB_COLOR.exec(color.trim());
  if (rgb) {
    const [red, green, blue] = rgb.slice(1).map(Number);
    if ([red, green, blue].every((channel) => channel <= 255)) return [red, green, blue];
  }

  return null;
}

/**
 * A cor com a opacidade pedida, de 0 a 1, em "rgba(...)". Junta o alfa pelo número, e não por um sufixo
 * hex grudado na cor, que quebra em silêncio quando a cor do tema não está em "#RRGGBB".
 * Uma cor ou opacidade inválida é bug de código, por isso lança erro em vez de devolver outra cor.
 */
export function withAlpha(color: string, opacity: number): string {
  const channels = parseChannels(color);
  if (!channels) throw new Error(`withAlpha: cor em formato não suportado: ${color}`);
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
    throw new Error(`withAlpha: opacidade fora de 0 a 1: ${opacity}`);
  }
  return `rgba(${channels.join(", ")}, ${opacity})`;
}
