import {
  KeyboardAvoidingView,
  StyleSheet,
  ScrollView,
  View,
  Text,
} from "react-native";
import { useState } from "react";
import { Screen, TipoServico } from "../../../config/consts";
import { useScreen } from "../../../hooks/useScreen";

import { Appointment, AppointmentBuilder } from "../../../model/Appointment";

import DefaultHeader from "../../components/Header/DefaultHeader";
import TitleBar from "../../components/Cadastro/TitleBar";
import InputInfo from "../../components/Cadastro/InputInfo";
import Toggle from "../../components/Cadastro/Botões/Toggle";
import { appointmentController } from "../../../controller/AppointmentsController";
import { useError } from "../../../hooks/useError";

export default function NewOrEditAppointment() {
  const { params, navigate } = useScreen<Appointment>();

  const isEditing = Boolean(params?.id);
  const { showError } = useError();

  const [nomePet, setNomePet] = useState("");
  const [idPet, setIdPet] = useState<number>(0);

  const [servico, setServico] = useState(params?.servico ?? TipoServico.Banho);
  const [data, setData] = useState(params?.data ?? 0);
  const [hora, setHora] = useState(params?.hora ?? undefined);
  const [entregarPet, setEntregarPet] = useState<number>(
    params?.entregar_pet ?? 0,
  );
  const [concluido, setConcluido] = useState(params?.concluido ?? 0);
  const [observacao, setObservacao] = useState(params?.observacao ?? "");

  //Quando não auto gerado, o db já criar isso como false(ou seja, 0), so fica true isso aqui quando é criado na trigger
  //Minha ideia é não alterar isso, por conta de que, foi criado automatico e se o dono do petshop mudar
  //deve continuar como auto gerado
  //Mas é interessante fazer algo visual para mostrar se foi auto gerado ou não
  const [autoGen, setAutoGen] = useState(params?.is_auto_agen ?? "");

  const salvarDono = async () => {
    const appointmentSalvar = new AppointmentBuilder()
      .withPetId(idPet)
      .withServico(servico)
      .withHora(hora ?? "00:00")
      .withData(data)
      .withEntregarPet(entregarPet != 1 ? 0 : 1)
      .withObservacao(observacao)
      .isConcluido(concluido != 1 ? 0 : 1)
      .build();

    try {
      if (isEditing) {
        await appointmentController.updateAppointment(
          params!.id!,
          appointmentSalvar,
        );
      } else {
        await appointmentController.createAppointment(appointmentSalvar);
      }
      navigate(Screen.Calendario);
    } catch (erro) {
      showError(erro instanceof Error ? erro.message : "Erro inesperado.");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex}>
      <DefaultHeader />
      <TitleBar
        returnTo={Screen.Calendario}
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
              image={require("../../../assets/animais/petHome.png")}
              item={nomePet}
              setItem={setServico}
              placeHolder="Digite o nome do Pet..."
              titleName="Nome do Pet"
              variasLinhas={false}
              hasBorderBottom={true}
            />
            <InputInfo
              image={require("../../../assets/outros/search.png")}
              item={servico}
              setItem={setNomePet}
              placeHolder="Selecione o serviço..."
              titleName="Serviço"
              variasLinhas={false}
              hasBorderBottom={true}
            />
            <Toggle
              onChange={setEntregarPet}
              value={entregarPet}
              hasBorderBottom={true}
              image={require("../../../assets/outros/entrega.png")}
              title="Entregar Pet?"
            />
            <InputInfo
              image={require("../../../assets/animais/pet.png")}
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
