// ThemeContext.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ImageStyle,
  TextStyle,
  useColorScheme,
  ViewStyle,
} from "react-native";
import { configsController } from "../../controller/ConfigsController";
import { logError } from "../../errors/AppError";
import { THEME_COLORS, type ThemeColors } from "./colors";

//USE: const { colors, isDark, trocarTheme } = useTheme();
//USE: const s = useThemedStyles(styles);
export type { ThemeColors };

type ThemeContextType = {
  isDark: boolean;
  colors: ThemeColors;
  trocarTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [temaCarregado, setTemaCarregado] = useState(false);

  useEffect(() => {
    configsController
      .getConfigById(1)
      .then((item) => {
        if (item != null) {
          setIsDark(item.is_ativo === 1);
        }
      })
      // Sem o tema salvo, o app abre no claro; o ErrorProvider fica dentro deste provider.
      .catch((error) => logError(error, "tema"))
      .finally(() => {
        setTemaCarregado(true); // sempre libera, mesmo se der erro
      });
  }, []);

  if (!temaCarregado) return null; // aguarda sem renderizar nada

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        colors: isDark ? THEME_COLORS.dark : THEME_COLORS.light,
        trocarTheme: () => setIsDark((p) => !p),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme precisa estar dentro do ThemeProvider");
  return ctx;
};

// O React Native 0.88 deixou de exportar StyleSheet.NamedStyles.
type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function useThemedStyles<T extends NamedStyles<T>>(
  factory: (colors: ThemeColors) => T,
): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors]);
}
