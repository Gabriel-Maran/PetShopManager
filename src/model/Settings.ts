/** O tema escolhido pelo usuário. Sem escolha gravada, o app segue o tema do sistema (P19). */
export const ThemePreference = {
  Light: "light",
  Dark: "dark",
} as const;
export type ThemePreference = (typeof ThemePreference)[keyof typeof ThemePreference];
