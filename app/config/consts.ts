import { Platform, StatusBar } from "react-native";

export const STATUS_BAR_HEIGHT =
  Platform.OS === "ios" ? 44 : (StatusBar.currentHeight ?? 24);

export const APP_BAR_HEIGHT = 70;

export const IMAGENS_BY_NAME = {
  ARTIGO: {
    active: require("../assets/nav_bar/ativados/artigo.png"),
    inactive: require("../assets/desativados/artigoDesativado.png"),
  },
  PESSOA_ADD: {
    active: require("../assets/nav_bar/ativados/personAddGreen.png"),
    inactive: require("../assets/nav_bar/desativados/pessoaAddDesativado.png"),
  },
  CALENDARIO: {
    active: require("../assets/nav_bar/ativados/calendario.png"),
    inactive: require("../assets/nav_bar/desativados/calendarioDesativado.png"),
  },
};

export enum TipoServico {
  Banho = "Banho",
  Tosa = "Tosa",
  BanhoETosa = "Banho e Tosa",
}

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
  NewOrEditAppointment = "NewOrEditAppointment",
}

export enum PacoteRemarcacao {
  Mensal = 4,
  Quinzenal = 2,
}

export enum EspeciesAtendidas {
  CAO = "CAO",
  GATO = "GATO",
  OUTRO = "OUTRO",
}

export enum EspeciesAtendidasLabel {
  CAO = "Cão",
  GATO = "Gato",
  OUTRO = "Outro",
}

export enum PorteAnimal {
  PEQUENO = "PEQUENO",
  MEDIO = "MEDIO",
  GRANDE = "GRANDE",
  GRANDAO = "GRANDAO",
}

export const PorteAnimalLabel = {
  PEQUENO: "Pequeno",
  MEDIO: "Médio",
  GRANDE: "Grande",
  GRANDAO: "Grandão",
};

export enum ORDER {
  ASC = "ASC",
  DESC = "DESC",
}
