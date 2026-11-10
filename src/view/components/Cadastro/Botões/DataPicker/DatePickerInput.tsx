import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemeColors, useThemedStyles } from "../../../../Themes/ThemeProvider";
import { isoToBr } from "../../../../../utils/datas";
import { A11Y_LABELS } from "../../../../../globals/accessibilityLabels";
import { HIDDEN_FROM_SCREEN_READER } from "../../../Acessibilidade/accessibilityProps";
import {
  FONT_SIZE,
  FONT_WEIGHT,
  LINE_HEIGHTS,
  RADIUS,
  SPACING,
} from "../../../../Themes/tokens";

export interface DatePickerInputProps {
  withIcon?: boolean;
  value?: string; // YYYY-MM-DD
  placeholder?: string;
  label?: string;
  /** Nome do campo para o leitor de tela, quando o rótulo visível fica fora do componente. */
  accessibilityName?: string;
  onPress: () => void;
  isEditavel?: boolean;
  error?: string;
}

export function DatePickerInput({
  withIcon = true,
  value,
  placeholder = "Selecione uma data",
  label,
  accessibilityName,
  onPress,
  isEditavel,
  error,
}: DatePickerInputProps) {
  const s = useThemedStyles(inputStyles);
  const displayText = value ? isoToBr(value) : placeholder;
  // O leitor fala o nome do campo e a data, como "Data do agendamento: 09/11/2026".
  const name = accessibilityName || label;

  return (
    <View style={s.wrapper}>
      {label && <Text style={s.label}>{label}</Text>}

      <TouchableOpacity
        activeOpacity={0.7}
        style={[s.inputRow, error ? s.inputRowError : null]}
        onPress={onPress}
        disabled={isEditavel}
        accessibilityRole="button"
        accessibilityLabel={name ? A11Y_LABELS.field(name, displayText) : displayText}
        accessibilityHint={A11Y_LABELS.datePickerHint}
      >
        {withIcon && (
          <Text style={s.icon} {...HIDDEN_FROM_SCREEN_READER}>
            📅
          </Text>
        )}

        <Text style={[s.text, !value && s.placeholder]}>{displayText}</Text>

        <Text style={s.chevron} {...HIDDEN_FROM_SCREEN_READER}>
          ›
        </Text>
      </TouchableOpacity>

      {error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

const inputStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: { gap: SPACING[6] },
    label: {
      fontSize: FONT_SIZE.BODY,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
      color: colors.TEXT_PRIMARY,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING[10],
      borderWidth: 1.5,
      borderColor: colors.BORDER_STRONG,
      borderRadius: RADIUS[10],
      paddingVertical: SPACING[12],
      paddingHorizontal: SPACING[14],
    },
    inputRowError: {
      borderColor: colors.RED_COLOR,
    },
    icon: { fontSize: FONT_SIZE.TITLE_SMALL },
    text: {
      flex: 1,
      fontSize: FONT_SIZE.SUBTITLE,
      color: colors.TEXT_SECONDARY,
    },
    placeholder: {
      color: colors.TEXT_PLACEHOLDER,
    },
    chevron: {
      fontSize: FONT_SIZE.TITLE_LARGE,
      color: colors.PRIMARY_CONTRAST,
      lineHeight: LINE_HEIGHTS[24],
    },
    error: {
      fontSize: FONT_SIZE.SMALL,
      color: colors.RED_COLOR,
    },
  });
