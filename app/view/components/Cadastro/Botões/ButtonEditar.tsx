import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { COLORS, Screen } from "../../../../config/consts";
import { useScreen } from "../../../../hooks/useScreen";
import { Owner } from "../../../../model/Owner";
import { Pet } from "../../../../model/Pet";
import { Appointment } from "../../../../model/Appointment";

export default function ButtonEditar({
  navegarPara,
  selectParam,
  editCampo,
  goEdit,
  setModal,
}: {
  navegarPara: Screen;
  selectParam?: Pet | Owner | Appointment;
  editCampo?: boolean;
  goEdit?: boolean;
  setModal?: () => void;
}) {
  const { screen, navigate, params } = useScreen();
  return (
    <View style={styles.ctnEdit}>
      <TouchableOpacity
        onPress={
          goEdit
            ? setModal
            : () => {
                navigate(navegarPara, selectParam);
              }
        }
        style={editCampo == false ? styles.btnEdit : styles.btnEditCampo}
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
    backgroundColor: COLORS.EDITAR_BACKGROUND_COLOR,
    padding: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.EDITAR_BORDER_COLOR,
  },
  btnEditCampo: {
    backgroundColor: COLORS.EDITAR_CAMPO_BACKGROUND_COLOR,
    padding: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.EDITAR_CAMPO_BORDER_COLOR,
  },
  iconEdit: {
    height: 28,
    width: 28,
  },
});
