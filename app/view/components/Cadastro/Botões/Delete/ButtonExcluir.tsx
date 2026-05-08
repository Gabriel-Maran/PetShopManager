import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useScreen } from "../../../../../hooks/useScreen";
import { COLORS } from "../../../../../config/consts";

export default function ButtonExcluir({
  onDelete,
  itemId,
}: {
  onDelete: (itemId: number) => void;
  itemId: number;
}) {
  const { screen, navigate } = useScreen();
  return (
    <View style={styles.ctnDelete}>
      <TouchableOpacity
        onPress={() => onDelete(itemId)}
        style={styles.btnDelete}
      >
        <Image
          style={styles.iconDelete}
          source={require("../../../../../assets/crud/delete.png")}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  ctnDelete: {
    alignSelf: "center",
    justifyContent: "flex-end",
  },
  btnDelete: {
    marginLeft: 10,
    backgroundColor: COLORS.EXCLUIR_BACKGROUND_COLOR,
    padding: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.EXCLUIR_BORDER_COLOR,
  },
  iconDelete: {
    height: 28,
    width: 28,
  },
});
