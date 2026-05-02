import { StyleSheet, Text, View } from "react-native";
import {
  Screen,
  APP_BAR_HEIGHT,
  IMAGENS_NAME_BAR,
} from "../../../config/consts";
import IconDePesquisa from "./IconDePesquisa";
import { IMAGENS_NAMES } from "../../../config/consts";
import { useScreen } from "../../../hooks/useScreen";

export default function AppBar() {
  const { screen, navigate } = useScreen();
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
    backgroundColor: "#ffffff",
    height: APP_BAR_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
});
