import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";
import { StatusFiltro } from "../../../config/consts";
import { A11Y_LABELS } from "../../../globals/accessibilityLabels";
import { touchTargetSlop } from "../Acessibilidade/accessibilityProps";

interface FilterPanelProps {
  value: StatusFiltro;
  onChange: (n: number) => void;
  onClose: () => void;
}

type AccentColor = keyof Pick<ThemeColors, "GREEN_COLOR" | "RED_COLOR">;

const OPCOES: { val: StatusFiltro; label: string; accent: AccentColor }[] = [
  { val: "ativo", label: "Ativos", accent: "GREEN_COLOR" },
  { val: "inativo", label: "Inativos", accent: "RED_COLOR" },
];

// O fundo da opção escolhida é a cor dela com 6% de opacidade; o teste de contraste confere o texto
// sobre esse fundo.
const ACTIVE_BACKGROUND_ALPHA = "10";

const CHIP_PADDING_VERTICAL = 7;
const CHIP_BORDER_WIDTH = 1.5;
const CHIP_LINE_HEIGHT = 18;
const CHIP_HEIGHT =
  CHIP_LINE_HEIGHT + 2 * (CHIP_PADDING_VERTICAL + CHIP_BORDER_WIDTH);

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
      {/* Em maiúsculas, o leitor poderia soletrar; o rótulo faz ele ler a palavra. */}
      <Text style={s.title} accessibilityLabel={A11Y_LABELS.filter.group}>
        STATUS
      </Text>
      <View style={s.row} accessibilityRole="radiogroup">
        {OPCOES.map((op) => {
          const active = value === op.val; // Verifica se o valor atual é igual à opção
          const accent = colors[op.accent];

          return (
            <TouchableOpacity
              key={op.val}
              // Destaque da borda do Chip
              style={[
                s.chip,
                active && {
                  borderColor: accent,
                  backgroundColor: accent + ACTIVE_BACKGROUND_ALPHA,
                },
              ]}
              onPress={() => handleSelect(op.val)}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              hitSlop={touchTargetSlop({ height: CHIP_HEIGHT })}
            >
              <View
                style={[
                  s.dot,
                  {
                    // Destaque do círculo interno
                    backgroundColor: active ? accent : "transparent",
                    borderColor: active ? accent : colors.BORDER_STRONG,
                  },
                ]}
              />
              <Text
                style={[
                  s.chipLabel,
                  // Destaque do texto
                  active && { color: accent, fontWeight: "700" },
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
      paddingVertical: CHIP_PADDING_VERTICAL,
      paddingHorizontal: 13,
      borderRadius: 99,
      borderWidth: CHIP_BORDER_WIDTH,
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
      lineHeight: CHIP_LINE_HEIGHT,
      fontWeight: "500",
      color: colors.TEXT_MUTED,
    },
  });
