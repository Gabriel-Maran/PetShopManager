import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { Screen } from "../../../../config/consts";
import { useScreen } from "../../../../hooks/useScreen";
import { Owner } from "../../../../model/Owner";
import { Pet } from "../../../../model/Pet";

export default function ButtonEditar({
  navegarPara,
  selectParam,
}: {
  navegarPara: Screen;
  selectParam?: Pet | Owner;
}) {
  const { screen, navigate, params } = useScreen();
  return (
    <View style={styles.ctnEdit}>
      <TouchableOpacity
        onPress={() => {
          navigate(navegarPara, selectParam);
        }}
        style={styles.btnEdit}
      >
        <Image
          style={styles.iconEdit}
          source={require("../../../../assets/crud/edit.png")}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  ctnEdit: {
    alignSelf: "center",
  },
  btnEdit: {
    backgroundColor: "#E1F5EE",
    padding: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#1D9E75",
  },
  iconEdit: {
    height: 28,
    width: 28,
  },
});
