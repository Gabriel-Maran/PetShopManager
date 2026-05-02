import { Platform, StatusBar } from "react-native";

export const STATUS_BAR_HEIGHT =
  Platform.OS === "ios" ? 44 : (StatusBar.currentHeight ?? 24);

export const APP_BAR_HEIGHT = 70;

export const IMAGENS_BY_NAME = {
  ARTIGO: {
    active: require("../assets/artigo.png"),
    inactive: require("../assets/artigoDesativado.png"),
  },
  PESSOA_ADD: {
    active: require("../assets/pessoaAdd.png"),
    inactive: require("../assets/pessoaAddDesativado.png"),
  },
  CALENDARIO: {
    active: require("../assets/calendario.png"),
    inactive: require("../assets/calendarioDesativado.png"),
  },
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
  NewOrEditOwner = "NewOrEditOwner",
  NewOrEditPet = "NewOrEditPet",
}
