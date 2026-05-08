import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useScreen } from "../../../hooks/useScreen";
import { COLORS, Screen } from "../../../config/consts";
const LOGO = require("../../../assets/logo/logoPetShopFundoBranco.png");
const BACK_ICON = require("../../../assets/setas/back.png");

export default function DefaultHeader({ screenBack }: { screenBack?: Screen }) {
  const { navigate } = useScreen();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.btnImg}
        accessibilityLabel="Ir para calendário"
        onPress={() => navigate(Screen.Calendario)}
      >
        <Image source={LOGO} style={styles.img} />
      </TouchableOpacity>

      {screenBack && (
        <TouchableOpacity
          style={styles.btnVoltar}
          accessibilityLabel="Voltar"
          onPress={() => navigate(screenBack)}
        >
          <Image source={BACK_ICON} style={styles.imgVoltar} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.BACKGROUND,
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
  btnVoltar: {
    position: "absolute",
    top: 5,
    bottom: 5,
    left: 10,
    borderRadius: 32.5,
    justifyContent: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  imgVoltar: {
    width: 28,
    height: 28,
  },
});
