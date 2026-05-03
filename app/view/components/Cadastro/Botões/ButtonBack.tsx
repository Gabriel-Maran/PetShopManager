import { Image, StyleSheet, TouchableOpacity } from "react-native";
import { Screen } from "../../../../config/consts";
import { useScreen } from "../../../../hooks/useScreen";

export default function ButtonBack({ backTo }: { backTo: Screen }) {
  const { screen, navigate } = useScreen();
  return (
    <TouchableOpacity onPress={() => navigate(backTo)} style={styles.btnBack}>
      <Image
        style={styles.imgBack}
        source={require("../../../../assets/voltarBlack.png")}
      />
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  imgBack: {
    height: 28,
    width: 28,
  },
  btnBack: {
    borderColor: "#DDDDDD",
    borderWidth: 1,
    alignSelf: "center",
    padding: 8,
    borderRadius: 15,
  },
});
