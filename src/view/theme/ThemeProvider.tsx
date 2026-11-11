import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ImageStyle, TextStyle, useColorScheme, ViewStyle } from "react-native";
import { settingsController } from "../../controller/SettingsController";
import { logError } from "../../errors/AppError";
import { ThemePreference } from "../../model/Settings";
import { THEME_COLORS, type ThemeColors } from "./colors";

// Nos componentes: `const { colors, isDark, setTheme } = useTheme();` e
// `const s = useThemedStyles(styles);`.
export type { ThemeColors };

type ThemeContextType = {
  isDark: boolean;
  colors: ThemeColors;
  /** Troca o tema na tela. Quem chama grava a escolha (ThemeToggle), para a falha aparecer no modal. */
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Sem escolha gravada, vale o tema do sistema (P19), e ele acompanha a troca feita no aparelho.
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference | null>(null);
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    settingsController
      .findTheme()
      .then(setPreference)
      // Sem o tema salvo, o app segue o sistema; o ErrorProvider fica dentro deste provider.
      .catch((error) => logError(error, "tema"))
      .finally(() => setThemeLoaded(true));
  }, []);

  const isDark = (preference ?? systemScheme) === ThemePreference.Dark;
  const value = useMemo(
    () => ({
      isDark,
      colors: isDark ? THEME_COLORS.dark : THEME_COLORS.light,
      setTheme: setPreference,
    }),
    [isDark],
  );

  // Sem tela até ler o tema salvo, para o app não piscar no tema errado.
  if (!themeLoaded) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme precisa estar dentro do ThemeProvider");
  return ctx;
};

// O React Native 0.88 deixou de exportar StyleSheet.NamedStyles.
type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function useThemedStyles<T extends NamedStyles<T>>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}
