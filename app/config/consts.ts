import { Platform, StatusBar } from "react-native";

export const STATUS_BAR_HEIGHT =
  Platform.OS === "ios" ? 44 : (StatusBar.currentHeight ?? 24);

export const SEARCH_BAR_HEIGHT = 70;

export const IMAGENS_BY_NAME = {
  ARTIGO: require("../assets/artigo.png"),
  PESSOA_ADD: require("../assets/pessoaAdd.png"),
  CALENDARIO: require("../assets/calendario.png"),
};

export enum IMAGENS_NAMES {
  ARTIGO = "ARTIGO",
  PESSOA_ADD = "PESSOA_ADD",
  CALENDARIO = "CALENDARIO",
}

export enum Screen {
  Calendario = "Calendario",
  Cadastros = "Cadastros",
  Relatorios = "Relatorios",
}
