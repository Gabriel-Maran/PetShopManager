import { Platform, StatusBar } from "react-native";
import { Pet, PetWithSpeciesBreedAndOwner } from "../model/Pet";
import { Owner } from "../model/Owner";

export const STATUS_BAR_HEIGHT =
  Platform.OS === "ios" ? 44 : (StatusBar.currentHeight ?? 24);

export const APP_BAR_HEIGHT = 70;

export const LIMIT_ITEM_PAGE = 20;

export const ICONS_BY_NAME = {
  ARTICLE: require("../assets/nav_bar/artigo.png"),
  PERSON_ADD: require("../assets/nav_bar/personAdd.png"),
  CALENDAR: require("../assets/nav_bar/calendario.png"),
  SETTINGS: require("../assets/nav_bar/settings.png"),
};

// As telas vivem em navigation.ts, que roda nos testes; o reexport mantém os imports de consts.
export { Screen } from "./navigation";

// Os valores do pet vivem em petEnums.ts, que roda nos testes; o reexport mantém os imports de consts.
export {
  SpeciesCode,
  SpeciesLabel,
  isPackageFrequency,
  PackageFrequency,
  PetSize,
  PetSizeLabel,
  ServiceName,
} from "./petEnums";

export enum ICON_NAMES {
  ARTICLE = "ARTICLE",
  PERSON_ADD = "PERSON_ADD",
  CALENDAR = "CALENDAR",
  SETTINGS = "SETTINGS",
}
export type RegistryParams = {
  mode: "create" | "view" | "edit";
  owner?: Owner;
  pet?: Pet | PetWithSpeciesBreedAndOwner;
  type: "OWNER" | "PET";
};

export enum ReportType {
  BusiestDaysAndHours = "BusiestDaysAndHours",
  AbsentPets = "AbsentPets",
  Reschedules = "Reschedules",
  AppointmentOrigin = "AppointmentOrigin",
  MonthlyComparison = "MonthlyComparison",
  Packages = "Packages",
}

export type ReportParams = {
  type: ReportType;
};

export type StatusFilter = "active" | "inactive";
