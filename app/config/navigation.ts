// As telas do app e para onde o voltar leva a partir de cada uma (BUG-8). Sem depender do React Native,
// para os testes rodarem no Node; por isso as telas são um objeto, e não um enum.
import type { NewOrEditCadastros } from "./consts";

export const Screen = {
  Calendario: "Calendario",
  Cadastros: "Cadastros",
  Relatorios: "Relatorios",
  Configuracoes: "Configuracoes",
  NewOrEditOwner: "NewOrEditOwner",
  NewOrEditPet: "NewOrEditPet",
  NewOrEditAppointment: "NewOrEditAppointment",
  RelatorioView: "RelatorioView",
} as const;

export type Screen = (typeof Screen)[keyof typeof Screen];

/** Uma tela e os parâmetros com que ela abre. */
export type Route = Readonly<{ screen: Screen; params?: unknown }>;

/** A tela em que o app abre. O voltar nela fecha o app. */
export const HOME_SCREEN: Screen = Screen.Calendario;

const backToHome: Route = { screen: HOME_SCREEN };

/** Os formulários de dono e pet voltam para a aba deles em Cadastros. */
const backToRegistry = (type: NewOrEditCadastros["type"]): Route => ({
  screen: Screen.Cadastros,
  params: { type, mode: "view" } satisfies NewOrEditCadastros,
});

const BACK_ROUTES: Record<Screen, Route | null> = {
  [Screen.Calendario]: null,
  [Screen.Cadastros]: backToHome,
  [Screen.Relatorios]: backToHome,
  [Screen.Configuracoes]: backToHome,
  [Screen.NewOrEditOwner]: backToRegistry("DONO"),
  [Screen.NewOrEditPet]: backToRegistry("PET"),
  [Screen.NewOrEditAppointment]: { screen: Screen.Calendario },
  [Screen.RelatorioView]: { screen: Screen.Relatorios },
};

/** Para onde o voltar leva a partir da tela, ou null quando ele fecha o app. */
export function backRouteOf(screen: Screen): Route | null {
  return BACK_ROUTES[screen];
}
