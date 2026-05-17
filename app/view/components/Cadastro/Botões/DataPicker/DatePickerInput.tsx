import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../../../Themes/ThemeProvider";
import { hifen_para_br } from "../../../../../utils/dataPicker/dataPickerAux";

export interface DatePickerInputProps {
  withIcon?: boolean;
  value?: string; // YYYY-MM-DD
  placeholder?: string;
  label?: string;
  onPress: () => void;
  error?: string;
}

export function DatePickerInput({
  withIcon = true,
  value,
  placeholder = "Selecione uma data",
  label,
  onPress,
  error,
}: DatePickerInputProps) {
  const { colors } = useTheme();
  const s = useThemedStyles(inputStyles);

  return (
    <View style={s.wrapper}>
      {label && <Text style={s.label}>{label}</Text>}

      <TouchableOpacity
        activeOpacity={0.7}
        style={[s.inputRow, error ? s.inputRowError : null]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
      >
        {/* Ícone de calendário (unicode simples — troque por um ícone da sua lib) */}
        {withIcon && <Text style={s.icon}>📅</Text>}

        <Text style={[s.text, !value && s.placeholder]}>
          {value ? hifen_para_br(value) : placeholder}
        </Text>

        <Text style={s.chevron}>›</Text>
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
      borderColor: "#E53E3E",
    },
    icon: { fontSize: 18 },
    text: {
      flex: 1,
      fontSize: 16,
      color: colors.TEXT_SECONDARY,
    },
    placeholder: {
      color: colors.THIRD_BACKGROUND,
    },
    chevron: {
      fontSize: 22,
      color: colors.PRIMARY_CONTRAST,
      lineHeight: 24,
    },
    error: {
      fontSize: 12,
      color: "#E53E3E",
    },
  });
