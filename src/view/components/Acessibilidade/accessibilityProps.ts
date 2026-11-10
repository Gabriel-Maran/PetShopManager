// Props de acessibilidade usadas em vários componentes (A11Y-1). Sem depender do React Native em tempo
// de execução, para os testes rodarem no Node.
import type { Insets } from "react-native";

/** Área de toque mínima recomendada pelo Android, em dp. */
export const MIN_TOUCH_TARGET = 48;

/**
 * O hitSlop que completa a área de toque até 48 dp sem mudar o tamanho do botão na tela. Recebe o
 * tamanho visível; o lado que já tem 48 dp ou mais fica sem acréscimo.
 */
export function touchTargetSlop({
  width = MIN_TOUCH_TARGET,
  height = MIN_TOUCH_TARGET,
}: {
  width?: number;
  height?: number;
}): Insets {
  const horizontal = Math.max(0, (MIN_TOUCH_TARGET - width) / 2);
  const vertical = Math.max(0, (MIN_TOUCH_TARGET - height) / 2);
  return { top: vertical, bottom: vertical, left: horizontal, right: horizontal };
}

/**
 * Esconde do leitor de tela um emoji ou desenho que só enfeita, para ele não ser lido em voz alta. O
 * texto ao lado continua sendo lido.
 */
export const HIDDEN_FROM_SCREEN_READER = {
  accessible: false,
  importantForAccessibility: "no-hide-descendants",
  accessibilityElementsHidden: true,
} as const;
