import type { ThemePreference } from "../model/Settings";
import { settingsService } from "../service/SettingsService";
import { parseInput } from "../validation/parseInput";
import { themeSchema } from "../validation/settingsSchema";

class SettingsController {
  findTheme(): Promise<ThemePreference | null> {
    return settingsService.findTheme();
  }

  saveTheme(theme: ThemePreference): Promise<void> {
    return settingsService.saveTheme(parseInput(themeSchema, theme));
  }
}

export const settingsController = new SettingsController();
