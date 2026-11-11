import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useScreen } from "../../../hooks/useScreen";
import { Screen } from "../../../config/consts";
import { ThemeColors, useTheme, useThemedStyles } from "../../theme/ThemeProvider";
import { A11Y_LABELS } from "../../../globals/accessibilityLabels";
import { SPACING } from "../../theme/tokens";

const LOGO_ON_LIGHT = require("../../../assets/logo/logoPetShopLightBackground.png");
const LOGO_ON_DARK = require("../../../assets/logo/logoPetShopDarkBackground.png");

/** O logo no topo das telas, que leva ao Calendário. O voltar fica na TitleBar e no botão do Android. */
export default function DefaultHeader() {
  const { navigate } = useScreen();
  const s = useThemedStyles(styles);
  const { isDark } = useTheme();

  return (
    <View style={s.container}>
      <TouchableOpacity
        style={s.btnImg}
        accessibilityRole="button"
        accessibilityLabel={A11Y_LABELS.goToCalendar}
        onPress={() => navigate(Screen.Calendar)}
      >
        <Image resizeMode="contain" source={isDark ? LOGO_ON_DARK : LOGO_ON_LIGHT} style={s.img} />
      </TouchableOpacity>
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.BACKGROUND,
      paddingBottom: SPACING[10],
    },
    btnImg: {
      width: 200,
      height: 50,
      alignSelf: "center",
      justifyContent: "center",
    },
    img: {
      width: 160,
      alignSelf: "center",
    },
  });
