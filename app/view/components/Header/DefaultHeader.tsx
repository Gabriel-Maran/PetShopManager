import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useScreen } from "../../../hooks/useScreen";
import { Screen } from "../../../config/consts";

export default function DefaultHeader() {
  const { screen, navigate } = useScreen();
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.btnImg}
        onPress={() => navigate(Screen.Calendario)}
      >
        <Image
          source={require("../../../assets/logoPetShopFundoBranco.png")}
          style={styles.img}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingBottom: 10,
  },
  btnImg: {
    width: 200,
    height: 50,
    alignSelf: "center",
  },
  img: {
    width: 180,
    height: 50,
    alignSelf: "center",
  },
});
