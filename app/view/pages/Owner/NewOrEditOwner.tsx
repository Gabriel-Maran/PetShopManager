import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Screen } from "../../../config/consts";
import DefaultHeader from "../../components/Header/DefaultHeader";
import TitleBar from "../../components/Cadastro/TitleBar";
import { Owner } from "../../../model/Owner";
import { useState } from "react";
import InputInfo from "../../components/Cadastro/InputInfo";

export default function NewOrEditOwner({
  ownerToEdit,
}: {
  ownerToEdit?: Owner;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  return (
    <>
      <DefaultHeader />
      <TitleBar
        returnTo={Screen.Cadastros}
        title="Novo Dono"
        subtitle="Preencha os dados do resposável"
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.ctnCadastro}>
          <View style={styles.viewDataRequired}>
            <Text>DADOS OBRIGÁTORIOS</Text>
          </View>
          <View style={styles.inputs}>
            <InputInfo
              image={require("../../../assets/personGreen.png")}
              item={nome}
              setItem={setNome}
              placeHolder="Digite o nome..."
              titleName="Nome Completo"
            />
            <InputInfo
              image={require("../../../assets/phoneGreen.png")}
              item={telefone}
              setItem={setTelefone}
              placeHolder="(46) 90000-0000"
              titleName="Telefone"
            />
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  ctnCadastro: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  viewDataRequired: {
    width: "100%",
  },
  inputs: {
    width: "100%",
    alignContent: "center",
    gap: 10,
  },
});
