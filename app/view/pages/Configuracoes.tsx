import { StyleSheet, Text, View } from "react-native";
import DefaultHeader from "../components/Header/DefaultHeader";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../Themes/ThemeProvider";
import ThemeToggle from "../components/ThemeToggle";

export default function Configuracoes() {
  const { colors, isDark, trocarTheme } = useTheme();
  const s = useThemedStyles(styles);

  return (
    <View style={{ flex: 1, backgroundColor: colors.THIRD_BACKGROUND }}>
      <DefaultHeader />
      <View style={s.switchMode}>
        <Text style={s.switchModeTxt}>Modo Atual:</Text>
        <ThemeToggle />
      </View>
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    switchMode: {
      flexDirection: "row",
      width: "100%",
      alignItems: "center",
      gap: 10,
      justifyContent: "space-evenly",
      marginVertical: 10,
      alignSelf: "center",
    },
    switchModeTxt: {
      flexDirection: "row",
      color: colors.TEXT_PRIMARY,
      fontWeight: "500",
      fontSize: 16,
    },
  });
