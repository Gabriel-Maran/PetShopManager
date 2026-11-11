// As preferências do app, como o tema (VALID-1). Sem depender do Expo, para os testes rodarem no
// Node, que exige a extensão .ts nos imports.
import { ThemePreference } from "../model/Settings.ts";
import { choice } from "./fields.ts";

export const themeSchema = choice(ThemePreference, "Tema");
