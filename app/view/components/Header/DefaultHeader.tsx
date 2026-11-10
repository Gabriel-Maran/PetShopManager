import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useScreen } from "../../../hooks/useScreen";
import { Screen } from "../../../config/consts";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";
import { A11Y_LABELS } from "../../../globals/accessibilityLabels";
const LOGO = require("../../../assets/logo/logoPetShopFundoBranco.png");
const BACK_ICON = require("../../../assets/setas/back.png");

export default function DefaultHeader({ screenBack }: { screenBack?: Screen }) {
  const { navigate } = useScreen();
  const s = useThemedStyles(styles);
  const { isDark } = useTheme();

  return (
    <View style={s.container}>
      <TouchableOpacity
        style={s.btnImg}
        accessibilityRole="button"
        accessibilityLabel={A11Y_LABELS.goToCalendar}
        onPress={() => navigate(Screen.Calendario)}
      >
        <Image
          resizeMode="contain"
          source={
            isDark
              ? require("../../../assets/logo/logoPetShopFundoEscuro.png")
              : require("../../../assets/logo/logoPetShopFundoBranco.png")
          }
          style={s.img}
        />
      </TouchableOpacity>

      {screenBack && (
        <TouchableOpacity
          style={s.btnVoltar}
          accessibilityRole="button"
          accessibilityLabel={A11Y_LABELS.back}
          onPress={() => navigate(screenBack)}
        >
          <Image source={BACK_ICON} style={s.imgVoltar} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.BACKGROUND,
      paddingBottom: 10,
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
    btnVoltar: {
      position: "absolute",
      top: 5,
      bottom: 5,
      left: 10,
      borderRadius: 32.5,
      justifyContent: "center",
      padding: 10,
      borderWidth: 1,
      borderColor: colors.PRIMARY,
    },
    imgVoltar: {
      width: 28,
      height: 28,
    },
  });
