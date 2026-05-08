import { Image, StyleSheet, Text, TouchableOpacity } from "react-native";
import {
  COLORS,
  IMAGENS_BY_NAME,
  IMAGENS_NAMES,
  Screen,
} from "../../../config/consts";
import { useScreen } from "../../../hooks/useScreen";

export default function IconDePesquisa({
  imgName,
  titleText,
  screenName,
}: {
  imgName: IMAGENS_NAMES;
  titleText: string;
  screenName: Screen;
}) {
  const { screen, navigate } = useScreen();
  const imageSource = IMAGENS_BY_NAME[imgName];
  return (
    <TouchableOpacity
      style={[
        styles.container,
        screen === screenName && {
          borderColor: COLORS.PRIMARY,
          borderTopWidth: 2,
        },
      ]}
      onPress={() => navigate(screenName)}
    >
      <Image
        style={[
          styles.image,
          screen != screenName && {
            borderColor: COLORS.PRIMARY,
            borderTopWidth: 2,
            tintColor: COLORS.DESATIVADO,
          },
        ]}
        source={imageSource}
      />
      <Text
        style={[
          styles.title,
          screen != screenName && {
            color: COLORS.DESATIVADO,
          },
        ]}
      >
        {titleText}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 5,
    height: "100%",
  },
  image: {
    width: 30,
    height: 30,
    tintColor: COLORS.PRIMARY,
  },
  title: {
    fontSize: 13,
    fontWeight: "bold",
    backgroundColor: COLORS.BACKGROUND,
    color: COLORS.PRIMARY,
  },
});
