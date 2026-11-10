import { StyleSheet, View } from "react-native";
import { NewOrEditCadastros, Screen } from "../../../../config/consts";
import { useScreen } from "../../../../hooks/useScreen";
import { Owner } from "../../../../model/Owner";
import { Pet } from "../../../../model/Pet";
import { Appointment } from "../../../../model/Appointment";
import ActionIconButton from "./ActionIconButton";

export default function ButtonEditar({
  navegarPara,
  selectParam,
  editCampo = false,
  goEdit,
  setModal,
  label,
}: {
  navegarPara: Screen;
  selectParam?: NewOrEditCadastros | Pet | Owner | Appointment | unknown;
  editCampo?: boolean;
  goEdit?: boolean;
  setModal?: () => void;
  /** O que o leitor de tela fala, como "Editar Rex" ou "Trocar dono". */
  label: string;
}) {
  const { navigate } = useScreen();

  return (
    <View style={styles.ctnEdit}>
      <ActionIconButton
        label={label}
        variant={editCampo ? "editField" : "edit"}
        icon={require("../../../../assets/crud/edit.png")}
        onPress={goEdit ? setModal : () => navigate(navegarPara, selectParam)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ctnEdit: {
    alignSelf: "center",
  },
});
