import {
  KeyboardAvoidingView,
  StyleSheet,
  ScrollView,
  View,
  Text,
} from "react-native";
import { useState } from "react";
import { Screen } from "../../../config/consts";
import { useScreen } from "../../../hooks/useScreen";

import { Appointment } from "../../../model/Appointment";

import DefaultHeader from "../../components/Header/DefaultHeader";
import TitleBar from "../../components/Cadastro/TitleBar";
import InputInfo from "../../components/Cadastro/InputInfo";
import Toggle from "../../components/Cadastro/Botões/Toggle";

export default function NewOrEditAppointment() {
  const { params, navigate } = useScreen<Appointment>();

  const isEditing = Boolean(params?.id);

  const [nomePet, setNomePet] = useState("");
  const [idPet, setIdPet] = useState("")

  const [servico, setServico] = useState(params?.servico ?? "");
  const [data, setData] = useState(params?.data ?? "");
  const [hora, setHora] = useState(params?.hora ?? "");
  const [entregarPet, setEntregarPet] = useState(params?.entregar_pet ?? "");
  const [concluido, setConcluido] = useState(params?.concluido ?? "");
  const [observacao, setObservacao] = useState(params?.observacao ?? "");
  const [autoGen, setAutoGen] = useState(params?.is_auto_agen ?? "");

  return (
    <KeyboardAvoidingView style={styles.flex}>
      <DefaultHeader />
      <TitleBar
        returnTo={Screen.Cadastros}
        title={isEditing ? "Editar Agendamento" : "Novo Agendamento"}
        subtitle="Preencha as informações"
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.ctnCadastro}>
          <View style={styles.viewDataReq}>
            <Text style={styles.titleDataInfo}>DADOS</Text>
          </View>
          <View style={styles.inputs}>
            <InputInfo
              image={require("../../../assets/petHome.png")}
              item={nomePet}
              setItem={setServico}
              placeHolder="Digite o nome do Pet..."
              titleName="Nome do Pet"
              variasLinhas={false}
              hasBorderBottom={true}
            />
            <InputInfo
              image={require("../../../assets/search.png")}
              item={servico}
              setItem={setNomePet}
              placeHolder="Selecione o serviço..."
              titleName="Serviço"
              variasLinhas={false}
              hasBorderBottom={true}
            />
            <Toggle hasBorderBottom={true} image={require("../../../assets/entrega.png")}/>
            <InputInfo
              image={require("../../../assets/pet.png")}
              item={observacao}
              setItem={setObservacao}
              placeHolder="Uma observação adicional..."
              titleName="Observações"
              variasLinhas={true}
              hasBorderBottom={true}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    backgroundColor: "#F5F5F5",
    flexGrow: 1,
  },
  ctnCadastro: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  viewDataReq: { width: "100%" },
  viewDataNotReq: {
    width: "100%",
    marginTop: 20,
  },
  inputs: {
    width: "100%",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EDEDED",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  titleDataInfo: {
    color: "#1D9D75",
    fontWeight: "500",
    marginBottom: 8,
  },
  ctnBtnSalvar: { marginTop: 25 },
  btnSalvar: {
    paddingVertical: 20,
    paddingHorizontal: 75,
    backgroundColor: "#1D9D75",
    borderRadius: 15,
  },
  txtSalvar: {
    color: "#fff",
    textAlign: "center",
  },
});
