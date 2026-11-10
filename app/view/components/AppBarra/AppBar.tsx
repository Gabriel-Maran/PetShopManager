import { StyleSheet, View } from "react-native";
import { APP_BAR_HEIGHT, IMAGENS_NAMES } from "../../../config/consts";
import { TAB_SCREENS } from "../../../config/navigation";
import IconDePesquisa from "./IconDePesquisa";
import { useTheme } from "../../Themes/ThemeProvider";

export default function AppBar() {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.BACKGROUND }]}
      accessibilityRole="tablist"
    >
      {TAB_SCREENS.map((tab) => (
        <IconDePesquisa
          key={tab.screen}
          imgName={IMAGENS_NAMES[tab.icon]}
          titleText={tab.title}
          screenName={tab.screen}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    height: APP_BAR_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
});
