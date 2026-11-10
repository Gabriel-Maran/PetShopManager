import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemeColors, useThemedStyles } from "../../../../Themes/ThemeProvider";
import { isoToBr } from "../../../../../utils/datas";
import { A11Y_LABELS } from "../../../../../globals/accessibilityLabels";
import { HIDDEN_FROM_SCREEN_READER } from "../../../Acessibilidade/accessibilityProps";

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
    wrapper: { gap: 6 },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.TEXT_PRIMARY,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1.5,
      borderColor: colors.BORDER_STRONG,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    inputRowError: {
      borderColor: colors.RED_COLOR,
    },
    icon: { fontSize: 18 },
    text: {
      flex: 1,
      fontSize: 16,
      color: colors.TEXT_SECONDARY,
    },
    placeholder: {
      color: colors.TEXT_PLACEHOLDER,
    },
    chevron: {
      fontSize: 22,
      color: colors.PRIMARY_CONTRAST,
      lineHeight: 24,
    },
    error: {
      fontSize: 12,
      color: colors.RED_COLOR,
    },
  });
