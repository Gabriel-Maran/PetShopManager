import { StyleSheet, View } from "react-native";
import ActionIconButton from "../ActionIconButton";

export default function ButtonExcluir({
  onDeactivate,
  itemId,
  label,
}: {
  onDeactivate: (itemId: number) => void;
  itemId: number;
  /** O que o leitor de tela fala, como "Desativar Rex". */
  label: string;
}) {
  return (
    <View style={styles.container}>
      <ActionIconButton
        label={label}
        variant="deactivate"
        icon={require("../../../../../assets/crud/delete.png")}
        onPress={() => onDeactivate(itemId)}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    justifyContent: "flex-end",
  },
  button: {
    marginLeft: 10,
  },
});
