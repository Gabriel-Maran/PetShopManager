import { Image, StyleSheet, Text, TouchableOpacity } from "react-native";
import { IMAGENS_BY_NAME, IMAGENS_NAMES, Screen } from "../../../config/consts";
import { useScreen } from "../../../hooks/useScreen";
import { useThemedStyles, ThemeColors } from "../../Themes/ThemeProvider";
import { FONT_SIZE, FONT_WEIGHT, SPACING } from "../../Themes/tokens";

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
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
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
      paddingBottom: SPACING[5],
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
    // A aba inativa continua tocável, então o texto dela precisa de 4,5:1: TEXT_MUTED, não DESATIVADO.
    imageInactive: {
      tintColor: colors.TEXT_MUTED,
    },
    title: {
      fontSize: FONT_SIZE.BODY_SMALL,
      fontWeight: FONT_WEIGHT.BOLD,
      color: colors.PRIMARY,
      backgroundColor: colors.BACKGROUND,
    },
    titleInactive: {
      color: colors.TEXT_MUTED,
    },
  });
