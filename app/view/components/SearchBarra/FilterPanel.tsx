import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";
import { StatusFiltro } from "../../../config/consts";

interface FilterPanelProps {
  value: StatusFiltro;
  onChange: (n: number) => void;
  onClose: () => void;
}

const OPCOES: { val: StatusFiltro; label: string; accent: string }[] = [
  { val: "ativo", label: "Ativos", accent: "#22C55E" },
  { val: "inativo", label: "Inativos", accent: "#EF4444" },
];

// ... imports

export default function FilterPanel({
  value,
  onChange,
  onClose,
}: FilterPanelProps) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();

  const handleSelect = (val: StatusFiltro) => {
    const numericValue = val === "ativo" ? 1 : 0;
    onChange(numericValue);
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>STATUS</Text>
      <View style={s.row}>
        {OPCOES.map((op) => {
          const active = value === op.val; // Verifica se o valor atual é igual à opção

          return (
            <TouchableOpacity
              key={op.val}
              // Destaque da borda do Chip
              style={[
                s.chip,
                active && {
                  borderColor: op.accent,
                  backgroundColor: op.accent + "10",
                }, // +10 adiciona transparência
              ]}
              onPress={() => handleSelect(op.val)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  s.dot,
                  {
                    // Destaque do círculo interno
                    backgroundColor: active ? op.accent : "transparent",
                    borderColor: active ? op.accent : colors.BORDER_STRONG,
                  },
                ]}
              />
              <Text
                style={[
                  s.chipLabel,
                  // Destaque do texto
                  active && { color: op.accent, fontWeight: "700" },
                ]}
              >
                {op.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.THIRD_BACKGROUND,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.BORDER_STRONG,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
      flex: 1,
    },
    title: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.TEXT_MUTED,
      letterSpacing: 1.2,
    },
    row: {
      flexDirection: "row",
      gap: 8,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingVertical: 7,
      paddingHorizontal: 13,
      borderRadius: 99,
      borderWidth: 1.5,
      borderColor: colors.BORDER_STRONG,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 99,
      borderWidth: 1.5,
    },
    chipLabel: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.TEXT_MUTED,
    },
  });
