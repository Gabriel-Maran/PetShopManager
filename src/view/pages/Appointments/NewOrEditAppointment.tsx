import {
  KeyboardAvoidingView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  Platform,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { EspeciesAtendidas, Screen } from "../../../config/consts";
import {
  MAX_MONEY_INPUT_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_TIME_LENGTH,
} from "../../../globals/limits";
import { useScreen } from "../../../hooks/useScreen";
import { useAsyncAction } from "../../../hooks/useAsyncAction";

import {
  useAgendamentos,
  usePetsComEspecieERacaBanco,
  useServicos,
  useTiposPagamento,
} from "../../../hooks/buscaBanco/useAppointment";

import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";

import { mascararHorario } from "../../../utils/mascarar";
import { maskMoneyInput, parseMoneyInput } from "../../../utils/dinheiro";
import {
  abrirModalSelecao,
  ModalConfig,
} from "../../../utils/abrirModalSelecao";

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
import ItemSelect from "../../components/Cadastro/ItemSelect";
import FormSectionTitle from "../../components/Cadastro/FormSectionTitle";
import SaveButton from "../../components/Cadastro/SaveButton";
import InputDataPicker from "../../components/Cadastro/Botões/DataPicker/InputDataPicker";
import { RADIUS, SPACING } from "../../Themes/tokens";

const MODAL_INICIAL: ModalConfig = {
  visivel: false,
  titulo: "",
  itemIcon: undefined,
  lista: [],
  aoSelecionar: () => {},
};

export default function NewOrEditAppointment() {
  const { params, navigate } = useScreen<NewOrEditAppointmentParams>();

  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  const isEditing = Boolean(params?.appointment?.id);

  const [appointmentSelected, setAppointmentSelected] = useState(true);
  const [modalConfig, setModalConfig] = useState<ModalConfig>(MODAL_INICIAL);

  const { appointmentsForm, updateAppointmentsField, isAppointmentDirty } =
    useAgendamentos();
  const { servicesForm } = useServicos();
  const { pgtosForm } = useTiposPagamento();

  const { petsForm, updatePetsField } = usePetsComEspecieERacaBanco(
    modalConfig.visivel,
  );

  // Sem isso, a lista do modal fica congelada no momento em que ele abriu, sem a busca nem a paginação.
  useEffect(() => {
    if (modalConfig.visivel) {
      setModalConfig((prev) => ({ ...prev, lista: petsForm.pets ?? [] }));
    }
  }, [petsForm.pets]);

  // Com proteção contra duplo clique. Dentro da ação: um valor digitado fora do formato vira a mensagem de erro da tela.
  const { run: salvarAgendamento, isRunning: isSalvando } = useAsyncAction(
    async () => {
      const appointmentSalvar = new AppointmentBuilder()
        .withPetId(appointmentsForm.pet_id)
        .withServico(appointmentsForm.servico)
        .withHora(appointmentsForm.hora ?? "00:00")
        .withData(appointmentsForm.data)
        .withEntregarPet(appointmentsForm.entregar_pet)
        .withObservacao(appointmentsForm.observacao)
        .withValor(parseMoneyInput(appointmentsForm.valor) ?? 0)
        .withTipoPgto(appointmentsForm.tipo_pgto)
        .isTaPago(appointmentsForm.ta_pago)
        .isConcluido(appointmentsForm.concluido)
        .build();

      if (isEditing) {
        await appointmentController.updateAppointment(
          params!.appointment?.id!,
          appointmentSalvar,
        );
      } else {
        await appointmentController.createAppointment(appointmentSalvar);
      }
      navigate(Screen.Calendario);
    },
  );

  const fecharModal = useCallback(() => {
    setModalConfig((prev) => ({ ...prev, visivel: false }));
  }, []);

  const handleAbrirModalPet = useCallback(() => {
    abrirModalSelecao({
      titulo: "Selecionar Pet",
      itemIcon: (pet) => {
        if (pet.nome_especie === EspeciesAtendidas.CAO)
          return require("../../../assets/animais/caoGreen.png");
        if (pet.nome_especie === EspeciesAtendidas.GATO)
          return require("../../../assets/animais/gatoGreen.png");
        return require("../../../assets/animais/interrogacaoGreen.png");
      },
      lista: petsForm.pets,
      setModalConfig,
      aoSelecionar: (pet) => {
        updateAppointmentsField("pet_id", pet.id);
        updateAppointmentsField("nome_pet", pet.nome);
        updateAppointmentsField("is_auto_agen", pet.remarcacao_ativa);
      },
    });
  }, [petsForm.pets, updateAppointmentsField]);

  const handleSetPage = useCallback(
    (value: number) => updatePetsField("page", value),
    [updatePetsField],
  );

  const handleSetSearch = useCallback(
    (txt: string) => {
      updatePetsField("page", 0);
      updatePetsField("searchTxt", txt);
    },
    [updatePetsField],
  );

  const handleChangeServico = useCallback(
    (item: any) => updateAppointmentsField("servico", item.servico),
    [updateAppointmentsField],
  );

  const handleChangeData = useCallback(
    (v: string) => updateAppointmentsField("data", v),
    [updateAppointmentsField],
  );

  const handleChangeHora = useCallback(
    (v: string) => updateAppointmentsField("hora", mascararHorario(v)),
    [updateAppointmentsField],
  );

  const handleChangeEntregarPet = useCallback(
    (value: number) => updateAppointmentsField("entregar_pet", value),
    [updateAppointmentsField],
  );

  const handleChangeObservacao = useCallback(
    (item: string) => updateAppointmentsField("observacao", item),
    [updateAppointmentsField],
  );

  const handleChangeConcluido = useCallback(
    (value: number) => updateAppointmentsField("concluido", value),
    [updateAppointmentsField],
  );

  const handleChangeValor = useCallback(
    (v: string) => updateAppointmentsField("valor", maskMoneyInput(v)),
    [updateAppointmentsField],
  );

  const handleChangeTipoPgto = useCallback(
    (item: any) => updateAppointmentsField("tipo_pgto", item.tipo_pgto),
    [updateAppointmentsField],
  );

  const handleChangeTaPago = useCallback(
    (value: number) => updateAppointmentsField("ta_pago", value),
    [updateAppointmentsField],
  );

  const renderServicoItem = useCallback(
    (item: any) => (
      <Text style={{ padding: SPACING[15], color: colors.TEXT_PRIMARY }}>
        {item.servico}
      </Text>
    ),
    [colors.TEXT_PRIMARY],
  );

  const renderPgtoItem = useCallback(
    (item: any) => (
      <Text style={{ padding: SPACING[15], color: colors.TEXT_PRIMARY }}>
        {item.tipo_pgto}
      </Text>
    ),
    [colors.TEXT_PRIMARY],
  );

  // O nome gravado no agendamento pode não estar mais na lista ativa (a migração oculta o que não era
  // da lista). O formulário mostra o nome em vez do aviso de "selecione", e salvar sem trocar vale.
  // O campo não corta a observação já gravada: com a nota da migração ela pode passar do limite. Ela
  // abre inteira, e salvar sem mudar vale; o que for editado volta a respeitar o limite (schema).
  const observationMaxLength = Math.max(
    MAX_NOTES_LENGTH,
    params?.appointment?.observacao?.length ?? 0,
  );

  const storedService = appointmentsForm.servico
    ? { id: 0, servico: appointmentsForm.servico }
    : undefined;
  const storedPaymentMethod = appointmentsForm.tipo_pgto
    ? { id: 0, tipo_pgto: appointmentsForm.tipo_pgto }
    : undefined;

  const BtnSalvar = (
    <View style={s.ctnBtnSalvar}>
      <SaveButton
        isEditing={isEditing}
        isSaving={isSalvando}
        onPress={salvarAgendamento}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <DefaultHeader />
      <TitleBar
        title={isEditing ? "Editar Agendamento" : "Novo Agendamento"}
        subtitle="Preencha as informações"
        hasUnsavedChanges={isAppointmentDirty}
      />
      <View style={s.escolhaItem} accessibilityRole="tablist">
        <ItemSelect
          title="Agendamento"
          isThisSelected={appointmentSelected}
          setValorSelect={() => setAppointmentSelected(true)}
          valorSelect={true}
        />
        <ItemSelect
          title="Valores"
          isThisSelected={!appointmentSelected}
          setValorSelect={() => setAppointmentSelected(false)}
          valorSelect={false}
        />
      </View>

      {appointmentSelected && (
        <>
          <ScrollView
            contentContainerStyle={s.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.ctnCadastro}>
              <View style={s.viewDataReq}>
                <FormSectionTitle title="Dados" />
              </View>
              <View style={s.inputs}>
                <SelectionField
                  image={require("../../../assets/animais/petHome.png")}
                  titleName="PET"
                  selectedReg={appointmentsForm.nome_pet}
                  buttonText="Selecionar Pet"
                  hasBorderBottom={true}
                  onPress={handleAbrirModalPet}
                  goEdit={true}
                  isEditavel={true}
                />
                <InputSelect
                  image={require("../../../assets/outros/servicos.png")}
                  titleName="Serviço"
                  placeholder="Selecione o serviço..."
                  itens={servicesForm.servico}
                  itemSelected={
                    servicesForm.servico.find(
                      (e) => e.servico === appointmentsForm.servico,
                    ) ?? storedService
                  }
                  labelExtractor={(item) => item.servico}
                  onChange={handleChangeServico}
                  renderItem={renderServicoItem}
                  hasBorderBottom={true}
                  isEditavel={true}
                />
                <InputDataPicker
                  image={require("../../../assets/outros/data.png")}
                  item={appointmentsForm.data}
                  setItem={handleChangeData}
                  titleName="Data do agendamento"
                  hasBorderBottom={true}
                  isEditavel={true}
                />
                <InputInfo
                  image={require("../../../assets/outros/hora.png")}
                  item={appointmentsForm.hora}
                  setItem={handleChangeHora}
                  placeHolder="Informe o horário..."
                  titleName="Horário"
                  variasLinhas={false}
                  tipoTeclado="numeric"
                  maximoCaracteres={MAX_TIME_LENGTH}
                  hasBorderBottom={true}
                />
                <Toggle
                  image={require("../../../assets/outros/entrega.png")}
                  value={appointmentsForm.entregar_pet}
                  onChange={handleChangeEntregarPet}
                  title="Táxi dog"
                  subtitle="Usará Táxi Dog?"
                  hasBorderBottom={true}
                  noEdit={false}
                />
                <InputInfo
                  image={require("../../../assets/nav_bar/artigo.png")}
                  item={appointmentsForm.observacao}
                  setItem={handleChangeObservacao}
                  placeHolder="Uma observação adicional..."
                  titleName="Observações"
                  variasLinhas={true}
                  maximoCaracteres={observationMaxLength}
                  hasBorderBottom={true}
                />
                {isEditing && (
                  <>
                    <Toggle
                      image={require("../../../assets/outros/concluido.png")}
                      value={appointmentsForm.concluido}
                      onChange={handleChangeConcluido}
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
                        subtitle=""
                        hasBorderBottom={false}
                        noEdit={true}
                      />
                    )}
                  </>
                )}
              </View>
              {BtnSalvar}
            </View>
          </ScrollView>

          <ModalSelectList
            isOpen={modalConfig.visivel}
            ehPet={true}
            items={modalConfig.lista}
            titulo={modalConfig.titulo}
            itemIcon={modalConfig.itemIcon}
            onSelect={modalConfig.aoSelecionar}
            onClose={fecharModal}
            page={petsForm.page}
            total={petsForm.total}
            setPage={handleSetPage}
            setSearch={handleSetSearch}
          />
        </>
      )}

      {!appointmentSelected && (
        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.ctnCadastro}>
            <View style={s.viewDataReq}>
              <FormSectionTitle title="Dados" />
            </View>
            <View style={s.inputs}>
              <InputInfo
                image={require("../../../assets/outros/valor.png")}
                item={appointmentsForm.valor}
                setItem={handleChangeValor}
                placeHolder="Valor do serviço..."
                titleName="Valor"
                variasLinhas={false}
                tipoTeclado="numeric"
                maximoCaracteres={MAX_MONEY_INPUT_LENGTH}
                hasBorderBottom={true}
              />
              <InputSelect
                image={require("../../../assets/outros/tipo_pgto.png")}
                titleName="Tipo de Pagamento"
                placeholder="Selecione o tipo de pgto..."
                itens={pgtosForm.tipos_pgto}
                itemSelected={
                  pgtosForm.tipos_pgto.find(
                    (e) => e.tipo_pgto === appointmentsForm.tipo_pgto,
                  ) ?? storedPaymentMethod
                }
                labelExtractor={(item) => item.tipo_pgto}
                onChange={handleChangeTipoPgto}
                renderItem={renderPgtoItem}
                hasBorderBottom={true}
                isEditavel={true}
              />
              <Toggle
                image={require("../../../assets/outros/pagamento.png")}
                value={appointmentsForm.ta_pago}
                onChange={handleChangeTaPago}
                title="Pagamento"
                subtitle="Cliente Pagou?"
                hasBorderBottom={false}
                noEdit={false}
              />
            </View>
            {BtnSalvar}
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.THIRD_BACKGROUND },
    scrollContent: {
      backgroundColor: colors.THIRD_BACKGROUND,
      flexGrow: 1,
      marginTop: SPACING[10],
    },
    escolhaItem: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      width: "100%",
      marginTop: SPACING[15],
      marginBottom: SPACING[10],
    },
    ctnCadastro: {
      flex: 1,
      padding: SPACING[20],
      alignItems: "center",
    },
    viewDataReq: { width: "100%", height: 28 },
    inputs: {
      width: "100%",
      borderRadius: RADIUS[10],
      borderWidth: 1,
      borderColor: colors.BORDER_LIGHT,
      backgroundColor: colors.BACKGROUND,
      overflow: "hidden",
    },
    ctnBtnSalvar: { marginTop: SPACING[15] },
  });
