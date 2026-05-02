import { Image, StyleSheet, Text, TouchableOpacity } from "react-native";
import { IMAGENS_BY_NAME, IMAGENS_NAMES, Screen } from "../../../config/consts";
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

  return (
    <TouchableOpacity
      style={[
        styles.container,
        screen === screenName && { borderColor: "#0E9599", borderTopWidth: 2 },
      ]}
      onPress={() => navigate(screenName)}
    >
      <Image style={styles.image} source={IMAGENS_BY_NAME[imgName]} />
      <Text style={styles.title}>{titleText}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 5,
    height: "100%",
  },
  image: {
    width: 30,
    height: 30,
  },
  title: {
    fontSize: 13,
    fontWeight: "bold",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
});
