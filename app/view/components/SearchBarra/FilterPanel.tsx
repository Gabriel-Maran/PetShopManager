import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ThemeColors, useThemedStyles } from "../../Themes/ThemeProvider";
import { StatusFiltro } from "../../../config/consts";

interface FilterPanelProps {
  value: StatusFiltro;
  onChange: (n: number) => void;
  onClose: () => void;
}

export default function FilterPanel({
  value,
  onChange,
  onClose,
}: FilterPanelProps) {
  const s = useThemedStyles(styles);

  const opcoes: {
    val: StatusFiltro;
    label: string;
    icon: string;
    color: string;
  }[] = [
    { val: "ativo", label: "Ativos", icon: "✅", color: "#3B6D11" },
    { val: "inativo", label: "Inativos", icon: "❌", color: "#A32D2D" },
  ];

  return (
    <View style={s.container}>
      <Text style={s.label}>Status</Text>
      <View style={s.row}>
        {opcoes.map((op) => {
          const active = value === op.val;
          return (
            <TouchableOpacity
              key={op.val}
              style={[
                s.chip,
                active && { backgroundColor: op.color, borderColor: op.color },
              ]}
              onPress={() => {
                const oper: number = op.val == "ativo" ? 1 : 0;
                onChange(oper);
                onClose();
                console.log(oper);
              }}
              activeOpacity={0.75}
            >
              <Text style={s.chipIcon}>{op.icon}</Text>
              <Text style={[s.chipLabel, active && s.chipLabelActive]}>
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
      flex: 1,
      backgroundColor: colors.THIRD_BACKGROUND,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.BORDER_STRONG,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 8,
    },
    label: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.TEXT_MUTED,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    row: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: colors.BORDER_STRONG,
      backgroundColor: colors.BACKGROUND,
    },
    chipIcon: { fontSize: 13 },
    chipLabel: { fontSize: 13, fontWeight: "500", color: colors.TEXT_PRIMARY },
    chipLabelActive: { color: "#fff" },
  });
