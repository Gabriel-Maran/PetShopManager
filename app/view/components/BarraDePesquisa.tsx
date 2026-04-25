import { StyleSheet, Text, View } from "react-native";
import { SEARCH_BAR_HEIGHT } from "../../../App";

export default function BarraDePesquisa() {
  return (
    <View
      style={[
        styles.container,
        { position: "absolute", bottom: 0, left: 0, right: 0 },
      ]}
    >
      <Text>Barra de Pesquisa</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    height: SEARCH_BAR_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
});
