import { StyleSheet, Text } from "react-native";
import { ThemeColors, useThemedStyles } from "../Themes/ThemeProvider";
import { A11Y_LABELS } from "../../globals/accessibilityLabels";
import IconButton from "./Acessibilidade/IconButton";
import { FONT_SIZE, FONT_WEIGHT, LINE_HEIGHTS } from "../Themes/tokens";

/** O diâmetro do círculo na tela; o IconButton completa a área de toque até 48 dp. */
const SIZE = 30;

/** O ✕ que fecha um modal, o mesmo em todos, com o nome "Fechar" para o leitor de tela. */
export default function CloseButton({ onPress }: { onPress: () => void }) {
  const s = useThemedStyles(styles);

  return (
    <IconButton
      label={A11Y_LABELS.close}
      width={SIZE}
      style={s.button}
      onPress={onPress}
    >
      <Text style={s.icon}>✕</Text>
    </IconButton>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      width: SIZE,
      height: SIZE,
      borderRadius: SIZE / 2,
      backgroundColor: colors.PRIMARY_SOFT,
      justifyContent: "center",
      alignItems: "center",
    },
    icon: {
      fontSize: FONT_SIZE.BODY_SMALL,
      lineHeight: LINE_HEIGHTS[15],
      color: colors.PRIMARY,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
    },
  });
