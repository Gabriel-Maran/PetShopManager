import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { Screen } from "../../../../config/consts";
import { useScreen } from "../../../../hooks/useScreen";

export default function ButtonBack({ backTo }: { backTo: Screen }) {
  const { screen, navigate } = useScreen();
  return (
    <TouchableOpacity onPress={() => navigate(backTo)} style={styles.btnBack}>
      <Image
        style={styles.imgBack}
        source={require("../../../../assets/setas/voltarBlack.png")}
      />
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  imgBack: {
    height: 40,
    width: 40,
  },
  btnBack: {
    borderColor: "#DDDDDD",
    borderWidth: 1,
    padding: 4,
    borderRadius: 15,
    justifyContent: "center",
  },
});
