import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { ThemeColors, useTheme, useThemedStyles } from "../../theme/ThemeProvider";
import { RADIUS, SPACING } from "../../theme/tokens";

/**
 * O botão Salvar dos formulários. Enquanto salva, o texto dá lugar ao indicador de carregamento; o
 * rótulo fixo mantém o nome do botão para o leitor de tela, que avisa que ele está ocupado.
 */
export default function SaveButton({
  isEditing,
  isSaving,
  onPress,
}: {
  isEditing: boolean;
  isSaving: boolean;
  onPress: () => void;
}) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  const label = isEditing ? "Salvar alterações" : "Salvar";

  return (
    <TouchableOpacity
      style={[s.button, isSaving && s.buttonBusy]}
      onPress={onPress}
      disabled={isSaving}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: isSaving, disabled: isSaving }}
    >
      {isSaving ? (
        <ActivityIndicator color={colors.BACKGROUND} />
      ) : (
        <Text style={s.text}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      paddingVertical: SPACING[20],
      paddingHorizontal: SPACING[75],
      backgroundColor: colors.PRIMARY_VARIANT,
      borderRadius: RADIUS[15],
    },
    buttonBusy: {
      opacity: 0.6,
    },
    text: {
      color: colors.BACKGROUND,
      textAlign: "center",
    },
  });
