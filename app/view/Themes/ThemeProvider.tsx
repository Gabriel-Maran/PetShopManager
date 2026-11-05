// ThemeContext.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ImageStyle,
  TextStyle,
  useColorScheme,
  ViewStyle,
} from "react-native";
import { configsController } from "../../controller/ConfigsController";

//USE: const { colors, isDark, trocarTheme } = useTheme();
//USE: const s = useThemedStyles(styles);
export type ThemeColors = typeof colors.light;

const colors = {
  light: {
    PRIMARY: "#0e996d",
    PRIMARY_VARIANT: "#1D9E75",
    PRIMARY_SOFT: "#E1F5EE",
    PRIMARY_CONTRAST: "#0E9599",

    BACKGROUND: "#ffffff",
    SECOND_BACKGROUND: "#b5b5b5",
    THIRD_BACKGROUND: "#f3f3f4",
    SURFACE: "#F2F3F7",
    SURFACE_VARIANT: "#EFEFEF",

    TEXT_PRIMARY: "#000000",
    TEXT_SECONDARY: "#2C2C2A",
    TEXT_MUTED: "#646462",
    TEXT_PLACEHOLDER: "#9a9a98",

    BORDER: "#F0F0F0",
    BORDER_STRONG: "#888888",
    BORDER_MID: "#b5b5b5",
    BORDER_LIGHT: "#cccdcf",

    MODAL_BACKGROUND: "rgba(0,0,0,0.45)",
    DESATIVADO: "#CECCC3",

    RED_COLOR: "#b71c1c",
    GREEN_COLOR: "#2e7d32",

    EXCLUIR_MAIN_COLOR: "rgb(203, 31, 31)",
    EXCLUIR_BORDER_COLOR: "#F09595",
    EXCLUIR_BACKGROUND_COLOR: "#FCEBEB",

    EDITAR_MAIN_COLOR: "#0e996d",
    EDITAR_BORDER_COLOR: "#1D9E75",
    EDITAR_BACKGROUND_COLOR: "#E1F5EE",

    EDITAR_CAMPO_MAIN_COLOR: "#888888",
    EDITAR_CAMPO_BORDER_COLOR: "#000000",
    EDITAR_CAMPO_BACKGROUND_COLOR: "#ffffff",

    FILTER_BACKGROUND: "#0e996d",
    FILTER_ICON: "#ffffff",

    REATIVAR_MAIN_COLOR: "#0284c7",
    REATIVAR_BORDER_COLOR: "#0ea5e9",
    REATIVAR_BACKGROUND_COLOR: "#f0f9ff",
  },
  dark: {
    PRIMARY: "#10B981",
    PRIMARY_VARIANT: "#0E996D",
    PRIMARY_SOFT: "#1A2E26",
    PRIMARY_CONTRAST: "#2DD4BF",

    BACKGROUND: "#0F1115",
    SECOND_BACKGROUND: "#1C1E23",
    THIRD_BACKGROUND: "#24272D",
    SURFACE: "#1E2128",
    SURFACE_VARIANT: "#2D3139",

    TEXT_PRIMARY: "#FFFFFF",
    TEXT_SECONDARY: "#E2E8F0",
    TEXT_MUTED: "#aeb1b6",
    TEXT_PLACEHOLDER: "#64748B",

    BORDER: "#2D3139",
    BORDER_STRONG: "#4A5568",
    BORDER_MID: "#3F444E",
    BORDER_LIGHT: "#2A2D35",

    MODAL_BACKGROUND: "rgba(0,0,0,0.80)",
    DESATIVADO: "#3D4148",

    RED_COLOR: "#e57373",
    GREEN_COLOR: "#81c784",

    EXCLUIR_MAIN_COLOR: "#F87171",
    EXCLUIR_BORDER_COLOR: "#991B1B",
    EXCLUIR_BACKGROUND_COLOR: "#2D1A1A",

    EDITAR_MAIN_COLOR: "#10B981",
    EDITAR_BORDER_COLOR: "#065F46",
    EDITAR_BACKGROUND_COLOR: "#13271F",

    EDITAR_CAMPO_MAIN_COLOR: "#CBD5E1",
    EDITAR_CAMPO_BORDER_COLOR: "#10B981",
    EDITAR_CAMPO_BACKGROUND_COLOR: "#1E2128",

    FILTER_BACKGROUND: "#10B981",
    FILTER_ICON: "#0F1115",

    REATIVAR_MAIN_COLOR: "#38bdf8",
    REATIVAR_BORDER_COLOR: "#075985",
    REATIVAR_BACKGROUND_COLOR: "#0c1e2b",
  },
};

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
      .catch((err) => {
        console.warn("Erro ao carregar tema:", err);
      })
      .finally(() => {
        setTemaCarregado(true); // sempre libera, mesmo se der erro
      });
  }, []);

  if (!temaCarregado) return null; // aguarda sem renderizar nada

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        colors: isDark ? colors.dark : colors.light,
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
