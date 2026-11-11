import type { ThemePreference } from "../model/Settings";
import { settingsRepository } from "../repository/SettingsRepository";

class SettingsService {
  /** O tema escolhido, ou null para seguir o do sistema. */
  findTheme(): Promise<ThemePreference | null> {
    return settingsRepository.findTheme();
  }

  saveTheme(theme: ThemePreference): Promise<void> {
    return settingsRepository.saveTheme(theme);
  }
}

export const settingsService = new SettingsService();
