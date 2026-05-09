import {
  KeyboardAvoidingView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { useEffect, useState } from "react";
import {
  COLORS,
  Screen,
  TipoServico,
  LIMIT_ITEM_PAGE,
  ORDER,
} from "../../../config/consts";
import { useScreen } from "../../../hooks/useScreen";
import { useError } from "../../../hooks/useError";

import { Pet } from "../../../model/Pet";
import { AppointmentBuilder, NewOrEditAppointmentParams } from "../../../model/Appointment";

import { petController } from "../../../controller/PetController";
import { appointmentController } from "../../../controller/AppointmentsController";

import DefaultHeader from "../../components/Header/DefaultHeader";
import TitleBar from "../../components/Cadastro/TitleBar";
import InputInfo from "../../components/Cadastro/InputInfo";
import Toggle from "../../components/Cadastro/Botões/Toggle";
import SelectionField from "../../components/Cadastro/SelectionField";
import ModalSelectList from "../../components/Cadastro/Modal/ModalSelectList";

import { DataHifenPraBarra, DataNumberPraString, DataStringPraNumber } from "../../../utils/converterData";
import Mascarar from "../../../utils/mascarar";

export default function NewOrEditAppointment() {
  const { params, navigate } = useScreen<NewOrEditAppointmentParams>();
  const { showError } = useError();

  const mascarar = Mascarar

  const isEditing = Boolean(params?.appointment?.id);
  console.log(isEditing)

  const [nomePet, setNomePet] = useState(params?.appointment?.nome_pet);
  const [idPet, setIdPet] = useState(params?.appointment?.pet_id ?? 0);

  const [servico, setServico] = useState(params?.appointment?.servico ?? "");
  const [data, setData] = useState<string>(
    params?.appointment?.data
      ? DataNumberPraString(params?.appointment?.data)
      : params?.dateSelected
        ? DataHifenPraBarra(params?.dateSelected)
        : "",
  );
  const [hora, setHora] = useState(params?.appointment?.hora ?? "");
  const [entregarPet, setEntregarPet] = useState<number>(
    params?.appointment?.entregar_pet ?? 0,
  );
  const [concluido, setConcluido] = useState(
    params?.appointment?.concluido ?? 0,
  );
  const [observacao, setObservacao] = useState(
    params?.appointment?.observacao ?? "",
  );

  const [taEditando, setTaEditando] = useState(false);

  //Quando não auto gerado, o db já criar isso como false(ou seja, 0), so fica true isso aqui quando é criado na trigger
  //Minha ideia é não alterar isso, por conta de que, foi criado automatico e se o dono do petshop mudar
  //deve continuar como auto gerado
  //Mas é interessante fazer algo visual para mostrar se foi auto gerado ou não
  const [autoGen, setAutoGen] = useState(
    params?.appointment?.is_auto_agen ?? 0,
  );

  const [modalPets, setModalPets] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchTxt, setSearchTxt] = useState("");
  const [pets, setPets] = useState<Pet[]>();

  useEffect(() => {
    try {
      petController
        .searchPetsByNamePaged(searchTxt, page, LIMIT_ITEM_PAGE, ORDER.DESC)
        .then(setPets)
        .catch(handleError);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Erro inesperado.");
    }
  }, [searchTxt, page]);

  const handleError = (e: unknown) =>
    showError(e instanceof Error ? e.message : "Erro inesperado.");

  const salvarAgendamento = async () => {
    const appointmentSalvar = new AppointmentBuilder()
      .withPetId(idPet)
      .withServico(servico)
      .withHora(hora ?? "00:00")
      .withData(DataStringPraNumber(data,"/"))
      .withEntregarPet(entregarPet)
      .withObservacao(observacao)
      .isConcluido(concluido)
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
            <SelectionField
              image={require("../../../assets/animais/petHome.png")}
              titleName={"PET"}
              selectedReg={nomePet}
              buttonText="Selecionar Pet"
              hasBorderBottom={true}
              onPress={() => setModalPets(true)}
              setModal={() => setModalPets(true)}
              goEdit={true}
            />
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
              setItem={(v) => setData(mascarar(v,1))}
              placeHolder="Informe a data..."
              titleName="Data"
              variasLinhas={true}
              digitavel={true}
              hasBorderBottom={true}
            />
            <InputInfo
              image={require("../../../assets/outros/hora.png")}
              item={hora}
              setItem={(v) => setHora(mascarar(v,2))}
              placeHolder="Informe o horário..."
              titleName="Horário"
              variasLinhas={true}
              digitavel={true}
              hasBorderBottom={true}
            />
            <Toggle
              image={require("../../../assets/outros/entrega.png")}
              value={entregarPet}
              onChange={setEntregarPet}
              title="Entrega"
              subtitle="Vai entregar o pet?"
              hasBorderBottom={true}
              noEdit={false}
            />
            <InputInfo
              image={require("../../../assets/nav_bar/artigo.png")}
              item={observacao}
              setItem={setObservacao}
              placeHolder="Uma observação adicional..."
              titleName="Observações"
              variasLinhas={true}
              digitavel={true}
              hasBorderBottom={true}
            />
            {isEditing && (
              <>
                <Toggle
                  image={require("../../../assets/outros/entrega.png")}
                  value={concluido}
                  onChange={setConcluido}
                  title="Status"
                  subtitle="Serviço concluído?"
                  hasBorderBottom={true}
                />
                {autoGen == 1 && (
                  <Toggle
                    image={require("../../../assets/outros/auto_gen.png")}
                    value={autoGen}
                    title="Agendamento Auto-gerado"
                    subtitle="Serviço concluído?"
                    noEdit={true}
                    hasBorderBottom={true}
                  />
                )}
              </>
            )}
          </View>
          <View style={styles.ctnBtnSalvar}>
            <TouchableOpacity
              style={styles.btnSalvar}
              onPress={salvarAgendamento}
            >
              <Text style={styles.txtSalvar}>
                {isEditing ? "Salvar alterações" : "Salvar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <ModalSelectList
        isOpen={modalPets}
        isOwner={false}
        items={pets}
        page={page}
        total={total}
        onClose={() => setModalPets(false)}
        onSelect={(item) => {
          setIdPet(item.id);
          setNomePet(item.nome);
          setAutoGen(item.remarcacao_ativa);
          setModalPets(false);
        }}
        setPage={setPage}
        setSearch={(txt) => {
          setPage(0);
          setSearchTxt(txt);
        }}
      />
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
  ctnBtnSalvar: { marginTop: 15 },
  btnSalvar: {
    paddingVertical: 20,
    paddingHorizontal: 75,
    backgroundColor: COLORS.PRIMARY_VARIANT,
    borderRadius: 15,
  },
  txtSalvar: {
    color: COLORS.BACKGROUND,
    textAlign: "center",
  },
});
