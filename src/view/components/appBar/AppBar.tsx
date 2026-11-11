import { StyleSheet, View } from "react-native";
import { APP_BAR_HEIGHT, ICON_NAMES } from "../../../config/consts";
import { TAB_SCREENS } from "../../../config/navigation";
import TabIcon from "./TabIcon";
import { useTheme } from "../../theme/ThemeProvider";

export default function AppBar() {
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
