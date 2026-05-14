import {
  KeyboardAvoidingView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useState } from "react";
import { Screen } from "../../../config/consts";
import { useScreen } from "../../../hooks/useScreen";
import { useError } from "../../../hooks/useError";

import {
  AppointmentBuilder,
  NewOrEditAppointmentParams,
} from "../../../model/Appointment";

import { appointmentController } from "../../../controller/AppointmentsController";

import DefaultHeader from "../../components/Header/DefaultHeader";
import TitleBar from "../../components/Cadastro/TitleBar";
import InputInfo from "../../components/Cadastro/InputInfo";
import Toggle from "../../components/Cadastro/Botões/Toggle";
import SelectionField from "../../components/Cadastro/SelectionField";
import ModalSelectList from "../../components/Cadastro/Modal/ModalSelectList";
import InputSelect from "../../components/InputSelect";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";

import { DataStringPraNumber } from "../../../utils/formatadores/converterData";
import Mascarar from "../../../utils/mascarar";

import {
  useAgendamentos,
  usePetsComEspecieERacaBanco,
  useServicos,
} from "../../../utils/buscaBanco/appointment";
import {
  abrirModalSelecao,
  ModalConfig,
} from "../../../utils/abrirModalSelecao";

export default function NewOrEditAppointment() {
  const { params, navigate } = useScreen<NewOrEditAppointmentParams>();
  const { showError } = useError();

  const { colors } = useTheme();

  const mascarar = Mascarar;

  const isEditing = Boolean(params?.appointment?.id);

  const { appointmentsForm, updateAppointmentsField } = useAgendamentos();

  const { servicesForm } = useServicos();

  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    visivel: false,
    titulo: "",
    itemIcon: undefined,
    lista: [],
    aoSelecionar: () => {},
  });

  const { petsForm, updatePetsField } = usePetsComEspecieERacaBanco(
    modalConfig.visivel
  );


  const salvarAgendamento = async () => {
    const appointmentSalvar = new AppointmentBuilder()
      .withPetId(appointmentsForm.pet_id)
      .withServico(appointmentsForm.servico)
      .withHora(appointmentsForm.hora ?? "00:00")
      .withData(DataStringPraNumber(appointmentsForm.data, "/"))
      .withEntregarPet(appointmentsForm.entregar_pet)
      .withObservacao(appointmentsForm.observacao)
      .isConcluido(appointmentsForm.concluido)
      .build();

    try {
      if (isEditing) {
        await appointmentController.updateAppointment(
          params!.appointment?.id!,
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

  const s = useThemedStyles(styles);

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <DefaultHeader />
      <TitleBar
        returnTo={Screen.Calendario}
        title={isEditing ? "Editar Agendamento" : "Novo Agendamento"}
        subtitle="Preencha as informações"
      />
      <ScrollView
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.ctnCadastro}>
          <View style={s.viewDataReq}>
            <Text style={s.titleDataInfo}>DADOS</Text>
          </View>
          <View style={s.inputs}>
            <SelectionField
              image={require("../../../assets/animais/petHome.png")}
              titleName={"PET"}
              selectedReg={appointmentsForm.nome_pet}
              buttonText="Selecionar Pet"
              hasBorderBottom={true}
              onPress={() =>
                abrirModalSelecao({
                  titulo: "Selecionar Pet",
                  itemIcon: require("../../../assets/animais/pet.png"),
                  lista: petsForm.pets,
                  setModalConfig,
                  aoSelecionar: (pet) => {
                    updateAppointmentsField("pet_id", pet.id);
                    updateAppointmentsField("nome_pet", pet.nome);
                    updateAppointmentsField(
                      "is_auto_agen",
                      pet.remarcacao_ativa,
                    );
                  },
                })
              }
              goEdit={true}
            />
            <InputSelect
              image={require("../../../assets/outros/servicos.png")}
              titleName="Serviço"
              placeholder="Selecione o serviço..."
              itens={servicesForm.servico}
              itemSelected={servicesForm.servico.find(
                (e) => e.servico === appointmentsForm.servico,
              )}
              labelExtractor={(item) => item.servico}
              onChange={(item) =>
                updateAppointmentsField("servico", item.servico)
              }
              renderItem={(item) => (
                <Text style={{ padding: 15, color: colors.TEXT_PRIMARY }}>
                  {item.servico}
                </Text>
              )}
              hasBorderBottom={true}
            />
            <InputInfo
              image={require("../../../assets/outros/data.png")}
              item={appointmentsForm.data}
              setItem={(v) => updateAppointmentsField("data", mascarar(v, 1))}
              placeHolder="Informe a data..."
              titleName="Data"
              variasLinhas={false}
              digitavel={true}
              hasBorderBottom={true}
            />
            <InputInfo
              image={require("../../../assets/outros/hora.png")}
              item={appointmentsForm.hora}
              setItem={(v) => updateAppointmentsField("hora", mascarar(v, 2))}
              placeHolder="Informe o horário..."
              titleName="Horário"
              variasLinhas={false}
              digitavel={true}
              hasBorderBottom={true}
            />
            <Toggle
              image={require("../../../assets/outros/entrega.png")}
              value={appointmentsForm.entregar_pet}
              onChange={(value) =>
                updateAppointmentsField("entregar_pet", value)
              }
              title="Táxi dog"
              subtitle="Vai usar táxi dog?"
              hasBorderBottom={true}
              noEdit={false}
            />
            <InputInfo
              image={require("../../../assets/nav_bar/artigo.png")}
              item={appointmentsForm.observacao}
              setItem={(item) => updateAppointmentsField("observacao", item)}
              placeHolder="Uma observação adicional..."
              titleName="Observações"
              variasLinhas={true}
              digitavel={true}
              hasBorderBottom={true}
            />
            {isEditing && (
              <>
                <Toggle
                  image={require("../../../assets/outros/concluido.png")}
                  value={appointmentsForm.concluido}
                  onChange={(value) =>
                    updateAppointmentsField("concluido", value)
                  }
                  title="Status"
                  subtitle="Serviço concluído?"
                  hasBorderBottom={true}
                />
                {appointmentsForm.is_auto_agen == 1 && (
                  <Toggle
                    image={require("../../../assets/outros/auto_gen.png")}
                    value={appointmentsForm.is_auto_agen}
                    onChange={(value) =>
                      updateAppointmentsField("is_auto_agen", value)
                    }
                    title="Agendamento Auto-gerado"
                    subtitle="Serviço concluído?"
                    hasBorderBottom={true}
                    noEdit={true}
                  />
                )}
              </>
            )}
          </View>
          <View style={s.ctnBtnSalvar}>
            <TouchableOpacity style={s.btnSalvar} onPress={salvarAgendamento}>
              <Text style={s.txtSalvar}>
                {isEditing ? "Salvar alterações" : "Salvar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <ModalSelectList
        isOpen={modalConfig.visivel}
        items={modalConfig.lista}
        titulo={modalConfig.titulo}
        onSelect={modalConfig.aoSelecionar}
        onClose={() => setModalConfig((prev) => ({ ...prev, visivel: false }))}
        page={petsForm.page}
        total={petsForm.total}
        setPage={(value) => updatePetsField("page", value)}
        setSearch={(txt) => {
          updatePetsField("page", 0);
          updatePetsField("searchTxt", txt);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    scrollContent: {
      backgroundColor: colors.THIRD_BACKGROUND,
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
      borderColor: colors.BORDER_LIGHT,
      backgroundColor: colors.BACKGROUND,
      overflow: "hidden",
    },
    titleDataInfo: {
      color: colors.PRIMARY_VARIANT,
      fontWeight: "500",
      marginBottom: 8,
    },
    ctnBtnSalvar: { marginTop: 15 },
    btnSalvar: {
      paddingVertical: 20,
      paddingHorizontal: 75,
      backgroundColor: colors.PRIMARY_VARIANT,
      borderRadius: 15,
    },
    txtSalvar: {
      color: colors.BACKGROUND,
      textAlign: "center",
    },
  });
