import { StyleSheet, Text, View } from "react-native";
import ButtonBack from "./Botões/ButtonBack";
import { Screen } from "../../../config/consts";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";

export default function TitleBar({
  title,
  subtitle,
  returnTo,
  isViewing,
}: {
  title: string;
  subtitle: string;
  returnTo: Screen;
  isViewing?: boolean;
}) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  return (
    <View style={s.container}>
      <ButtonBack backTo={returnTo} />
      <View>
        <Text style={s.txtTitle}>{title}</Text>
        {!isViewing && <Text style={s.txtSubTitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}
const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.THIRD_BACKGROUND,
      flexDirection: "row",
      borderWidth: 1,
      borderColor: colors.BORDER_MID,
      padding: 20,
      alignItems: "center",
      gap: 15,
    },
    txtTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.TEXT_PRIMARY,
    },
    txtSubTitle: {
      fontSize: 14,
      color: colors.TEXT_MUTED,
    },
  });
