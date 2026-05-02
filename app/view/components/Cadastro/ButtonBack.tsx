import { Image, StyleSheet, TouchableOpacity } from "react-native";
import { Screen } from "../../../config/consts";
import { useScreen } from "../../../hooks/useScreen";

export default function ButtonBack({ backTo }: { backTo: Screen }) {
  const { screen, navigate } = useScreen();
  return (
    <TouchableOpacity onPress={() => navigate(backTo)} style={styles.btnBack}>
      <Image
        style={styles.imgBack}
        source={require("../../../assets/voltarBlack.png")}
      />
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  imgBack: {
    height: 32,
    width: 32,
  },
  btnBack: {
    borderColor: "#DDDDDD",
    borderWidth: 2,
    alignSelf: "center",
    padding: 3,
    borderRadius: 15,
  },
});
