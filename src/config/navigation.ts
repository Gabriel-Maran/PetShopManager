// As telas do app e a regra de como cada navegação mexe na pilha (ARQ-3). Sem depender do React
// Native, para os testes rodarem no Node; por isso as telas são um objeto, e não um enum. O
// React Navigation executa o plano (hooks/useScreen.ts).
import type { ICON_NAMES } from "./consts";

export const Screen = {
  Calendar: "Calendar",
  Registry: "Registry",
  Reports: "Reports",
  Settings: "Settings",
  NewOrEditOwner: "NewOrEditOwner",
  NewOrEditPet: "NewOrEditPet",
  NewOrEditAppointment: "NewOrEditAppointment",
  ReportView: "ReportView",
} as const;

export type Screen = (typeof Screen)[keyof typeof Screen];

/** A tela em que o app abre. O voltar nela fecha o app. */
export const HOME_SCREEN: Screen = Screen.Calendar;

/** Uma aba da barra de baixo: a tela, o nome mostrado e a chave do ícone em ICON_NAMES. */
export type TabScreen = Readonly<{
  screen: Screen;
  title: string;
  icon: keyof typeof ICON_NAMES;
}>;

/** As abas da barra de baixo, na ordem em que aparecem. Só nessas telas a barra fica visível. */
export const TAB_SCREENS: readonly TabScreen[] = [
  { screen: Screen.Calendar, title: "Calendário", icon: "CALENDAR" },
  { screen: Screen.Registry, title: "Cadastros", icon: "PERSON_ADD" },
  { screen: Screen.Reports, title: "Relatórios", icon: "ARTICLE" },
  { screen: Screen.Settings, title: "Configurações", icon: "SETTINGS" },
];

/** Se a tela é uma das abas, para o App mostrar a barra de baixo. */
export function isTabScreen(screen: Screen): boolean {
  return TAB_SCREENS.some((tab) => tab.screen === screen);
}

/**
 * Como a pilha muda para abrir `target`:
 * - uma aba recomeça a pilha com o Calendário embaixo, para o voltar de qualquer aba levar a ele;
 *   a aba abre de novo, como antes, para recarregar a lista e ler os parâmetros;
 * - o Calendário fica sozinho na pilha, sem ser recriado;
 * - um formulário ou relatório entra no topo, e o voltar o tira.
 */
export type NavigationPlan =
  | Readonly<{ kind: "reset"; keepHome: boolean; target: Screen | null }>
  | Readonly<{ kind: "push"; target: Screen }>;

export function planNavigation(target: Screen): NavigationPlan {
  if (target === HOME_SCREEN) return { kind: "reset", keepHome: true, target: null };
  if (isTabScreen(target)) return { kind: "reset", keepHome: true, target };
  return { kind: "push", target };
}
