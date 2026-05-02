import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Screen } from "../../../config/consts";
import DefaultHeader from "../../components/Header/DefaultHeader";
import ButtonBack from "../../components/Cadastro/ButtonBack";

export default function NewOrEditOwner() {
  return (
    <>
      <DefaultHeader />
      <View style={styles.ctnNovoDOno}>
        <ButtonBack backTo={Screen.Cadastros} />
        <View>
          <Text style={styles.txtNovoDono}>Novo Dono</Text>
          <Text style={styles.txtPreencha}>
            Preencha os dados do responsável
          </Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.ctnCadastro}>
          <Text>Cadastro</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  ctnNovoDOno: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    padding: 20,
    alignItems: "center",
    gap: 15,
  },
  txtNovoDono: {
    fontSize: 20,
    fontWeight: "bold",
  },
  txtPreencha: {
    fontSize: 14,
    color: "#777777",
  },

  scrollContent: {
    flexGrow: 1,
  },
  ctnCadastro: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
});
