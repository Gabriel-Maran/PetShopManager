// As telas do app e para onde o voltar leva a partir de cada uma (BUG-8). Sem depender do React Native,
// para os testes rodarem no Node; por isso as telas são um objeto, e não um enum.
import type { ICON_NAMES, RegistryParams } from "./consts";

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

/** Uma tela e os parâmetros com que ela abre. */
export type Route = Readonly<{ screen: Screen; params?: unknown }>;

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

const backToHome: Route = { screen: HOME_SCREEN };

/** Os formulários de dono e pet voltam para a aba deles em Cadastros. */
const backToRegistry = (type: RegistryParams["type"]): Route => ({
  screen: Screen.Registry,
  params: { type, mode: "view" } satisfies RegistryParams,
});

const BACK_ROUTES: Record<Screen, Route | null> = {
  [Screen.Calendar]: null,
  [Screen.Registry]: backToHome,
  [Screen.Reports]: backToHome,
  [Screen.Settings]: backToHome,
  [Screen.NewOrEditOwner]: backToRegistry("OWNER"),
  [Screen.NewOrEditPet]: backToRegistry("PET"),
  [Screen.NewOrEditAppointment]: { screen: Screen.Calendar },
  [Screen.ReportView]: { screen: Screen.Reports },
};

/** Para onde o voltar leva a partir da tela, ou null quando ele fecha o app. */
export function backRouteOf(screen: Screen): Route | null {
  return BACK_ROUTES[screen];
}
