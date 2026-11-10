import { StyleSheet, Text } from "react-native";
import { ThemeColors, useThemedStyles } from "../../Themes/ThemeProvider";
import { FONT_WEIGHT, SPACING } from "../../Themes/tokens";

/**
 * O título de um grupo de campos do formulário, como "DADOS OBRIGATÓRIOS". Na tela vai em maiúsculas;
 * o rótulo em letra normal evita que o leitor de tela soletre, como no InputWrapper.
 */
export default function FormSectionTitle({ title }: { title: string }) {
  const s = useThemedStyles(styles);

  return (
    <Text style={s.title} accessibilityRole="header" accessibilityLabel={title}>
      {title.toUpperCase()}
    </Text>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    title: {
      color: colors.PRIMARY_VARIANT,
      fontWeight: FONT_WEIGHT.MEDIUM,
      marginBottom: SPACING[8],
    },
  });
