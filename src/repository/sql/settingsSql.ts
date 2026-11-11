// SQL das preferências (tabela settings, chave e valor), sem depender do Expo: o repository e os
// testes executam os mesmos comandos.

/** As chaves que o app grava. */
export const SETTING_KEYS = { theme: "theme" } as const;

/** Parâmetro: a chave. Sem linha, a preferência não foi escolhida. */
export const FIND_SETTING_SQL = "SELECT value FROM settings WHERE key = ?";

/** Parâmetros: a chave e o valor. Grava ou troca. */
export const SAVE_SETTING_SQL = `INSERT INTO settings (key, value) VALUES (?, ?)
  ON CONFLICT (key) DO UPDATE SET value = excluded.value`;
