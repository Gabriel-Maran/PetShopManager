import { Image, StyleSheet, Text, TouchableOpacity } from "react-native";
import { IMAGENS_BY_NAME, IMAGENS_NAMES, Screen } from "../../../config/consts";
import { useScreen } from "../../../hooks/useScreen";
import {
  useTheme,
  useThemedStyles,
  ThemeColors,
} from "../../Themes/ThemeProvider";

export default function IconDePesquisa({
  imgName,
  titleText,
  screenName,
}: {
  imgName: IMAGENS_NAMES;
  titleText: string;
  screenName: Screen;
}) {
  const s = useThemedStyles(styles);
  const { screen, navigate } = useScreen();
  const imageSource = IMAGENS_BY_NAME[imgName];
  const isActive = screen === screenName;

  return (
    <TouchableOpacity
      style={[s.container, isActive && s.containerActive]}
      onPress={() => navigate(screenName)}
    >
      <Image
        style={[s.image, !isActive && s.imageInactive]}
        source={imageSource}
      />
      <Text style={[s.title, !isActive && s.titleInactive]}>{titleText}</Text>
    </TouchableOpacity>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.BACKGROUND,
      justifyContent: "center",
      alignItems: "center",
      paddingBottom: 5,
      height: "100%",
    },
    containerActive: {
      borderTopWidth: 2,
      borderColor: colors.PRIMARY,
    },
    image: {
      width: 30,
      height: 30,
      tintColor: colors.PRIMARY,
    },
    imageInactive: {
      tintColor: colors.DESATIVADO,
    },
    title: {
      fontSize: 13,
      fontWeight: "bold",
      color: colors.PRIMARY,
      backgroundColor: colors.BACKGROUND,
    },
    titleInactive: {
      color: colors.DESATIVADO,
    },
  });
