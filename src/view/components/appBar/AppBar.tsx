import { StyleSheet, View } from "react-native";
import { APP_BAR_HEIGHT, ICON_NAMES } from "../../../config/consts";
import { TAB_SCREENS, type Screen } from "../../../config/navigation";
import type { NavigationContainerRef, ParamListBase } from "@react-navigation/native";
import { navigateTo } from "../../../hooks/useScreen";
import TabIcon from "./TabIcon";
import { useTheme } from "../../theme/ThemeProvider";

/** A barra fica fora da pilha, então recebe a tela aberta e navega pelo ref do NavigationContainer. */
export default function AppBar({
  current,
  navigator,
}: {
  current: Screen;
  navigator: NavigationContainerRef<ParamListBase>;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.BACKGROUND }]}
      accessibilityRole="tablist"
    >
      {TAB_SCREENS.map((tab) => (
        <TabIcon
          key={tab.screen}
          imgName={ICON_NAMES[tab.icon]}
          titleText={tab.title}
          isActive={tab.screen === current}
          onPress={() => navigateTo(navigator, tab.screen)}
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
