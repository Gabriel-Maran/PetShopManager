import { StyleSheet, View } from "react-native";
import { RegistryParams, Screen } from "../../../../config/consts";
import { useScreen } from "../../../../hooks/useScreen";
import { Owner } from "../../../../model/Owner";
import { Pet } from "../../../../model/Pet";
import { Appointment } from "../../../../model/Appointment";
import ActionIconButton from "./ActionIconButton";

export default function EditButton({
  navigateTo,
  selectParam,
  editField = false,
  goEdit,
  setModal,
  label,
}: {
  navigateTo: Screen;
  selectParam?: RegistryParams | Pet | Owner | Appointment | unknown;
  editField?: boolean;
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
        variant={editField ? "editField" : "edit"}
        icon={require("../../../../assets/crud/edit.png")}
        onPress={goEdit ? setModal : () => navigate(navigateTo, selectParam)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ctnEdit: {
    alignSelf: "center",
  },
});
