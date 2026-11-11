import { Image, StyleSheet, TouchableOpacity } from "react-native";
import { ThemeColors, useThemedStyles } from "../../../theme/ThemeProvider";
import { A11Y_LABELS } from "../../../../globals/accessibilityLabels";
import { RADIUS, SPACING } from "../../../theme/tokens";

export default function BackButton({ onPress }: { onPress: () => void }) {
  const s = useThemedStyles(styles);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={s.btnBack}
      accessibilityRole="button"
      accessibilityLabel={A11Y_LABELS.back}
    >
      <Image style={s.imgBack} source={require("../../../../assets/arrows/backBlack.png")} />
    </TouchableOpacity>
  );
}

// Ícone de 40 + padding de 4 + borda de 1 dos dois lados: 50 dp, acima do toque mínimo de 48 do
// Android, então o botão dispensa hitSlop.
const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    imgBack: {
      height: 40,
      width: 40,
      tintColor: colors.TEXT_PRIMARY,
    },
    btnBack: {
      borderColor: colors.BORDER_MID,
      borderWidth: 1,
      padding: SPACING[4],
      borderRadius: RADIUS[15],
      justifyContent: "center",
    },
  });
