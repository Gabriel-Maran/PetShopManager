import {
  KeyboardAvoidingView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image
} from "react-native";
import { useState } from "react";
import { COLORS, Screen, TipoServico } from "../../../config/consts";
import { useScreen } from "../../../hooks/useScreen";
import { useError } from "../../../hooks/useError";

import { Appointment, AppointmentBuilder } from "../../../model/Appointment";
import { appointmentController } from "../../../controller/AppointmentsController";

import DefaultHeader from "../../components/Header/DefaultHeader";
import TitleBar from "../../components/Cadastro/TitleBar";
import InputInfo from "../../components/Cadastro/InputInfo";
import Toggle from "../../components/Cadastro/Botões/Toggle";
import ButtonEditar from "../../components/Cadastro/Botões/ButtonEditar";


const maskData = (v: string) => {
  const d = v.replace(/\D/g, "");
  if (!d) return "";
  if (d.length <= 2) {
    return d;
  }
  if (d.length <= 4) {
    return `${d.slice(0, 2)}/${d.slice(2)}`;
  }
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4, 8)}`;
};

export default function NewOrEditAppointment() {
  const { params, navigate } = useScreen<Appointment>();

  const isEditing = Boolean(params?.id);
  const { showError } = useError();

  const [nomePet, setNomePet] = useState("");
  const [idPet, setIdPet] = useState<number>(0);

  const [servico, setServico] = useState(params?.servico ?? "");
  const [data, setData] = useState(
    params?.data ?
      new Date(params.data).toLocaleDateString("pt-BR") :
      ""
  );
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

  const [petSelecionado, setPetSelecionado] = useState(false)

  function converterPraNumber(dataTexto: string): number {
    const [dia, mes, ano] = dataTexto.split("/").map(Number);

    return new Date(ano, mes - 1, dia).getTime();
  }

  const salvarAgendamento = async () => {
    const appointmentSalvar = new AppointmentBuilder()
      .withPetId(idPet)
      .withServico(servico)
      .withHora(hora ?? "00:00")
      .withData(converterPraNumber(data))
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
            <View style={[
              styles.ctnInput,
              { borderBottomWidth: 1, borderColor: COLORS.BORDER_LIGHT }
            ]}>
              <View style={styles.ctnImgInput}>
                <Image
                  style={styles.imgInput}
                  source={require("../../../assets/animais/petHome.png")}
                />
              </View>
              <View style={{ width: "90%", gap: 5 }}>
                <Text style={styles.txtInput}>PET</Text>
                {petSelecionado ? (
                  <View style={styles.petSelecionado}>
                    <View style={styles.txtNomePet}>
                      <Text>Max</Text>
                    </View>
                    <ButtonEditar navegarPara={Screen.Cadastros} editCampo={true} />
                  </View>
                ) : (
                  <TouchableOpacity style={styles.btnSalvar} onPress={() => setPetSelecionado(true)}>
                    <Text style={styles.txtSalvar}>Selecionar Pet</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <InputInfo
              image={require("../../../assets/outros/servicos.png")}
              item={servico}
              setItem={setServico}
              placeHolder="Selecione o serviço..."
              titleName="Serviço"
              variasLinhas={false}
              digitavel={true}
              hasBorderBottom={true}
            />
            <InputInfo
              image={require("../../../assets/outros/data.png")}
              item={data}
              setItem={(v) => setData(maskData(v))}
              placeHolder="Informe a data..."
              titleName="Data"
              variasLinhas={true}
              digitavel={true}
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
              digitavel={true}
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
    backgroundColor: COLORS.THIRD_BACKGROUND,
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
    borderColor: COLORS.BORDER_LIGHT,
    backgroundColor: COLORS.BACKGROUND,
    overflow: "hidden",
  },
  titleDataInfo: {
    color: COLORS.PRIMARY_VARIANT,
    fontWeight: "500",
    marginBottom: 8,
  },
  ctnBtnSalvar: { marginTop: 25 },
  btnSalvar: {
    width: "90%",
    height: 50,
    backgroundColor: COLORS.PRIMARY_VARIANT,
    borderRadius: 15,
    display: 'flex',
    justifyContent: 'center'
  },
  txtSalvar: {
    color: COLORS.BACKGROUND,
    textAlign: "center",
    fontSize: 15,

  },
  ctnInput: {
    width: "100%",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ctnImgInput: {
    backgroundColor: COLORS.PRIMARY_SOFT,
    padding: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_VARIANT,
  },
  imgInput: {
    width: 28,
    height: 28,
    tintColor: COLORS.PRIMARY,
  },
  input: {
    color: COLORS.TEXT_PRIMARY,
    width: "90%",
    minHeight: 45,
    maxHeight: 90,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 40,
    paddingVertical: 5,
  },
  txtInput: {
    color: COLORS.TEXT_MUTED,
    fontWeight: "bold",
    fontSize: 12,
  },
  petSelecionado: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  editarCampo: {
    alignSelf: 'flex-end'
  },
  txtNomePet: {
    borderWidth: 1.3,
    width: '80%',
    padding:10,
    borderRadius: 10
  }
});
