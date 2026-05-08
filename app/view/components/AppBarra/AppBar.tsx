import { StyleSheet, Text, View } from "react-native";
import { Screen, APP_BAR_HEIGHT, COLORS } from "../../../config/consts";
import IconDePesquisa from "./IconDePesquisa";
import { IMAGENS_NAMES } from "../../../config/consts";

export default function AppBar() {
  return (
    <View
      style={[
        styles.container,
        { position: "absolute", bottom: 0, left: 0, right: 0 },
      ]}
    >
      <IconDePesquisa
        imgName={IMAGENS_NAMES.CALENDARIO}
        titleText="Calendário"
        screenName={Screen.Calendario}
      />
      <IconDePesquisa
        imgName={IMAGENS_NAMES.PESSOA_ADD}
        titleText="Cadastros"
        screenName={Screen.Cadastros}
      />
      <IconDePesquisa
        imgName={IMAGENS_NAMES.ARTIGO}
        titleText="Relatórios"
        screenName={Screen.Relatorios}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.BACKGROUND,
    height: APP_BAR_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
});
