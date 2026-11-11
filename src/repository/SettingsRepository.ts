import { getDatabase } from "../config/database";
import type { ThemePreference } from "../model/Settings";
import { FIND_SETTING_SQL, SAVE_SETTING_SQL, SETTING_KEYS } from "./sql/settingsSql";

class SettingsRepository {
  async findTheme(): Promise<ThemePreference | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: ThemePreference }>(FIND_SETTING_SQL, [SETTING_KEYS.theme]);
    return row?.value ?? null;
  }

  async saveTheme(theme: ThemePreference): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(SAVE_SETTING_SQL, [SETTING_KEYS.theme, theme]);
  }
}

export const settingsRepository = new SettingsRepository();
