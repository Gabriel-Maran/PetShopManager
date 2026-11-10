import { Platform, StatusBar } from "react-native";
import { Pet, PetWithSpecieRaceAndOwner } from "../model/Pet";
import { Owner } from "../model/Owner";
import { BarChartItem } from "../view/components/Relatorios/BarChart";

export const STATUS_BAR_HEIGHT =
  Platform.OS === "ios" ? 44 : (StatusBar.currentHeight ?? 24);

export const APP_BAR_HEIGHT = 70;

export const LIMIT_ITEM_PAGE = 20;

export const IMAGENS_BY_NAME = {
  ARTIGO: require("../assets/nav_bar/artigo.png"),
  PESSOA_ADD: require("../assets/nav_bar/personAdd.png"),
  CALENDARIO: require("../assets/nav_bar/calendario.png"),
  CONFIGURACOES: require("../assets/nav_bar/settings.png"),
};

// As telas vivem em navigation.ts, que roda nos testes; o reexport mantém os imports de consts.
export { Screen } from "./navigation";

// Os valores do pet vivem em petEnums.ts, que roda nos testes; o reexport mantém os imports de consts.
export {
  EspeciesAtendidas,
  EspeciesAtendidasLabel,
  PacoteRemarcacao,
  PorteAnimal,
  PorteAnimalLabel,
  TipoServico,
} from "./petEnums";

export enum IMAGENS_NAMES {
  ARTIGO = "ARTIGO",
  PESSOA_ADD = "PESSOA_ADD",
  CALENDARIO = "CALENDARIO",
  CONFIGURACOES = "CONFIGURACOES",
}
export type NewOrEditCadastros = {
  mode: "create" | "view" | "edit";
  owner?: Owner;
  pet?: Pet | PetWithSpecieRaceAndOwner;
  type: "DONO" | "PET";
};

export enum RelatorioType {
  DiasHorasMovimentados = "DiasHorasMovimentados",
  PetsAusentes = "PetsAusentes",
  Remarcacoes = "Remarcacoes",
  OrigemAgendamentos = "OrigemAgendamentos",
  ComparativoMensal = "ComparativoMensal",
  Pacotes = "Pacotes",
}

export type RelatorioParams = {
  type: RelatorioType;
};

export type StatusFiltro = "ativo" | "inativo";

export interface PlanoItem extends BarChartItem {
  pacote: 2 | 4;
}
