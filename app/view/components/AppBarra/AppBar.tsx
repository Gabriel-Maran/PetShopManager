import { StyleSheet, View } from "react-native";
import { Screen, APP_BAR_HEIGHT } from "../../../config/consts";
import { IMAGENS_NAMES } from "../../../config/consts";
import IconDePesquisa from "./IconDePesquisa";
import { useTheme } from "../../Themes/ThemeProvider";

export default function AppBar() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
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
      <IconDePesquisa
        imgName={IMAGENS_NAMES.CONFIGURACOES}
        titleText="Configurações"
        screenName={Screen.Configuracoes}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    height: APP_BAR_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
});
