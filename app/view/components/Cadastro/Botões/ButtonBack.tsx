import { Image, StyleSheet, TouchableOpacity } from "react-native";
import { ThemeColors, useThemedStyles } from "../../../Themes/ThemeProvider";

export default function ButtonBack({ onPress }: { onPress: () => void }) {
  const s = useThemedStyles(styles);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={s.btnBack}
      accessibilityRole="button"
      accessibilityLabel="Voltar"
    >
      <Image
        style={s.imgBack}
        source={require("../../../../assets/setas/voltarBlack.png")}
      />
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
      padding: 4,
      borderRadius: 15,
      justifyContent: "center",
    },
  });
