import { StyleSheet, View } from "react-native";
import ActionIconButton from "./ActionIconButton";

export default function ButtonAtivar({
  onActivate,
  itemId,
  label,
}: {
  onActivate: (itemId: number) => void;
  itemId: number;
  /** O que o leitor de tela fala, como "Reativar Rex". */
  label: string;
}) {
  return (
    <View style={styles.container}>
      <ActionIconButton
        label={label}
        variant="activate"
        icon={require("../../../../assets/crud/activate.png")}
        onPress={() => onActivate(itemId)}
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
