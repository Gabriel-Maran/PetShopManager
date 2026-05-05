import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useScreen } from "../../../../../hooks/useScreen";

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
          source={require("../../../../../assets/delete.png")}
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
    backgroundColor: "#FCEBEB",
    padding: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#F09595",
  },
  iconDelete: {
    height: 28,
    width: 28,
  },
});
