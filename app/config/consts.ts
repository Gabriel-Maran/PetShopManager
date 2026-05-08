import { Platform, StatusBar } from "react-native";

export const STATUS_BAR_HEIGHT =
  Platform.OS === "ios" ? 44 : (StatusBar.currentHeight ?? 24);

export const APP_BAR_HEIGHT = 70;

export const COLORS = {
  // Brand/Action (Verdes ajustados para contraste no escuro)
  PRIMARY: "#10b981",
  PRIMARY_VARIANT: "#059669",
  PRIMARY_SOFT: "#064e3b",
  PRIMARY_CONTRAST: "#34d399",

  // Backgrounds/Surfaces (Pretos e Cinzas Escuros)
  BACKGROUND: "#121212",
  SECOND_BACKGROUND: "#1e1e1e",
  THIRD_BACKGROUND: "#242424",
  SURFACE: "#2c2c2c",
  SURFACE_VARIANT: "#3d3d3d",

  // Typography/Icons (Brancos e Cinzas Claros)
  TEXT_PRIMARY: "#ffffff",
  TEXT_SECONDARY: "#e5e7eb",
  TEXT_MUTED: "#9ca3af",

  // Elements (Bordas e Divisores)
  BORDER: "#2d2d2d",
  BORDER_STRONG: "#525252",
  BORDER_MID: "#404040",
  BORDER_LIGHT: "#b4b2b2",

  MODAL_BACKGROUND: "rgba(0,0,0,0.75)",
  DESATIVADO: "#4b4b4b",

  // Feedback de Ações
  EXCLUIR_MAIN_COLOR: "#f87171",
  EXCLUIR_BORDER_COLOR: "#991b1b",
  EXCLUIR_BACKGROUND_COLOR: "#450a0a",

  EDITAR_MAIN_COLOR: "#10b981",
  EDITAR_BORDER_COLOR: "#065f46",
  EDITAR_BACKGROUND_COLOR: "#064e3b",
};

/*
export const COLORS = {
  // Brand/Action (Verdes ajustados para contraste no escuro)
  PRIMARY: "#10b981",
  PRIMARY_VARIANT: "#059669",
  PRIMARY_SOFT: "#064e3b",
  PRIMARY_CONTRAST: "#34d399",

  // Backgrounds/Surfaces (Pretos e Cinzas Escuros)
  BACKGROUND: "#121212",
  SECOND_BACKGROUND: "#1e1e1e",
  THIRD_BACKGROUND: "#242424",
  SURFACE: "#2c2c2c",
  SURFACE_VARIANT: "#3d3d3d",

  // Typography/Icons (Brancos e Cinzas Claros)
  TEXT_PRIMARY: "#ffffff",
  TEXT_SECONDARY: "#e5e7eb",
  TEXT_MUTED: "#9ca3af",

  // Elements (Bordas e Divisores)
  BORDER: "#2d2d2d",
  BORDER_STRONG: "#525252",
  BORDER_MID: "#404040",
  BORDER_LIGHT: "#b4b2b2",

  MODAL_BACKGROUND: "rgba(0,0,0,0.75)",
  DESATIVADO: "#4b4b4b",

  // Feedback de Ações
  EXCLUIR_MAIN_COLOR: "#f87171",
  EXCLUIR_BORDER_COLOR: "#991b1b",
  EXCLUIR_BACKGROUND_COLOR: "#450a0a",

  EDITAR_MAIN_COLOR: "#10b981",
  EDITAR_BORDER_COLOR: "#065f46",
  EDITAR_BACKGROUND_COLOR: "#064e3b",
};


*/

export const IMAGENS_BY_NAME = {
  ARTIGO: require("../assets/nav_bar/artigo.png"),
  PESSOA_ADD: require("../assets/nav_bar/personAdd.png"),
  CALENDARIO: require("../assets/nav_bar/calendario.png"),
};

export enum Screen {
  Calendario = "Calendario",
  Cadastros = "Cadastros",
  Relatorios = "Relatorios",
  NewOrEditOwner = "NewOrEditOwner",
  NewOrEditPet = "NewOrEditPet",
  NewOrEditAppointment = "NewOrEditAppointment",
}

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
