// ThemeContext.tsx
import { createContext, useContext, useMemo, useState } from "react";
import { StyleSheet, useColorScheme } from "react-native";

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

    BORDER: "#F0F0F0",
    BORDER_STRONG: "#888888",
    BORDER_MID: "#b5b5b5",
    BORDER_LIGHT: "#cccdcf",

    MODAL_BACKGROUND: "rgba(0,0,0,0.45)",
    DESATIVADO: "#CECCC3",

    EXCLUIR_MAIN_COLOR: "rgb(203, 31, 31)",
    EXCLUIR_BORDER_COLOR: "#F09595",
    EXCLUIR_BACKGROUND_COLOR: "#FCEBEB",

    EDITAR_MAIN_COLOR: "#0e996d",
    EDITAR_BORDER_COLOR: "#1D9E75",
    EDITAR_BACKGROUND_COLOR: "#E1F5EE",

    EDITAR_CAMPO_MAIN_COLOR: "#888888",
    EDITAR_CAMPO_BORDER_COLOR: "#000000",
    EDITAR_CAMPO_BACKGROUND_COLOR: "#ffffff",
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
    TEXT_MUTED: "#94A3B8",

    BORDER: "#2D3139",
    BORDER_STRONG: "#4A5568",
    BORDER_MID: "#3F444E",
    BORDER_LIGHT: "#2A2D35",

    MODAL_BACKGROUND: "rgba(0,0,0,0.80)",
    DESATIVADO: "#3D4148",

    EXCLUIR_MAIN_COLOR: "#F87171",
    EXCLUIR_BORDER_COLOR: "#991B1B",
    EXCLUIR_BACKGROUND_COLOR: "#2D1A1A",

    EDITAR_MAIN_COLOR: "#10B981",
    EDITAR_BORDER_COLOR: "#065F46",
    EDITAR_BACKGROUND_COLOR: "#13271F",

    EDITAR_CAMPO_MAIN_COLOR: "#CBD5E1",
    EDITAR_CAMPO_BORDER_COLOR: "#10B981",
    EDITAR_CAMPO_BACKGROUND_COLOR: "#1E2128",
  },
};

type ThemeContextType = {
  isDark: boolean;
  colors: ThemeColors;
  trocarTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === "dark");

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

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: ThemeColors) => T,
): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors]);
}
