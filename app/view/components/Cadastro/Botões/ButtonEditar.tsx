import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { Screen } from "../../../../config/consts";
import { useScreen } from "../../../../hooks/useScreen";
import { Owner } from "../../../../model/Owner";
import { Pet } from "../../../../model/Pet";
import { Appointment } from "../../../../model/Appointment";
import { ThemeColors, useThemedStyles } from "../../../Themes/ThemeProvider";

export default function ButtonEditar({
  navegarPara,
  selectParam,
  editCampo = false,
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
  const s = useThemedStyles(styles);

  return (
    <View style={s.ctnEdit}>
      <TouchableOpacity
        onPress={
          goEdit
            ? setModal
            : () => {
                navigate(navegarPara, selectParam);
              }
        }
        style={editCampo == false ? s.btnEdit : s.btnEditCampo}
      >
        <Image
          style={s.iconEdit}
          source={require("../../../../assets/crud/edit.png")}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    ctnEdit: {
      alignSelf: "center",
    },
    btnEdit: {
      backgroundColor: colors.EDITAR_BACKGROUND_COLOR,
      padding: 8,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.EDITAR_BORDER_COLOR,
    },
    btnEditCampo: {
      backgroundColor: colors.EDITAR_CAMPO_BACKGROUND_COLOR,
      padding: 8,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.EDITAR_CAMPO_BORDER_COLOR,
    },
    iconEdit: {
      height: 28,
      width: 28,
    },
  });
