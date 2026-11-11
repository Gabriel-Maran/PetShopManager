import {
  KeyboardAvoidingView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  Platform,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { SpeciesCode, Screen } from "../../../config/consts";
import {
  MAX_MONEY_INPUT_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_TIME_LENGTH,
} from "../../../globals/limits";
import { useScreen } from "../../../hooks/useScreen";
import { useAsyncAction } from "../../../hooks/useAsyncAction";

import {
  useAppointmentForm,
  usePetsWithSpeciesAndBreed,
  useServices,
  usePaymentMethods,
} from "../../../hooks/data/useAppointment";

import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../theme/ThemeProvider";

import { maskTime } from "../../../utils/timeMask";
import { maskMoneyInput, parseMoneyInput } from "../../../utils/money";
import {
  openSelectionModal,
  ModalConfig,
} from "../../../utils/openSelectionModal";

import {
  AppointmentBuilder,
  NewOrEditAppointmentParams,
} from "../../../model/Appointment";

import { appointmentController } from "../../../controller/AppointmentsController";

import DefaultHeader from "../../components/header/DefaultHeader";
import TitleBar from "../../components/registry/TitleBar";
import InputInfo from "../../components/registry/InputInfo";
import Toggle from "../../components/registry/buttons/Toggle";
import SelectionField from "../../components/registry/SelectionField";
import SelectListModal from "../../components/registry/modal/SelectListModal";
import InputSelect from "../../components/InputSelect";
import ItemSelect from "../../components/registry/ItemSelect";
import FormSectionTitle from "../../components/registry/FormSectionTitle";
import SaveButton from "../../components/registry/SaveButton";
import DatePickerField from "../../components/registry/datePicker/DatePickerField";
import { RADIUS, SPACING } from "../../theme/tokens";

const INITIAL_MODAL: ModalConfig = {
  visible: false,
  title: "",
  itemIcon: undefined,
  items: [],
  onSelect: () => {},
};

export default function NewOrEditAppointment() {
  const { params, navigate } = useScreen<NewOrEditAppointmentParams>();

  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  const isEditing = Boolean(params?.appointment?.id);

  const [appointmentSelected, setAppointmentSelected] = useState(true);
  const [modalConfig, setModalConfig] = useState<ModalConfig>(INITIAL_MODAL);

  const { appointmentsForm, updateAppointmentsField, isAppointmentDirty } =
    useAppointmentForm();
  const { servicesForm } = useServices();
  const { paymentMethodsForm } = usePaymentMethods();

  const { petsForm, updatePetsField } = usePetsWithSpeciesAndBreed(
    modalConfig.visible,
  );

  // Sem isso, a lista do modal fica congelada no momento em que ele abriu, sem a busca nem a paginação.
  useEffect(() => {
    if (modalConfig.visible) {
      setModalConfig((prev) => ({ ...prev, items: petsForm.pets ?? [] }));
    }
  }, [petsForm.pets]);

  // Com proteção contra duplo clique. Dentro da ação: um valor digitado fora do formato vira a mensagem de erro da tela.
  const { run: saveAppointment, isRunning: isSavingRecord } = useAsyncAction(
    async () => {
      const appointmentToSave = new AppointmentBuilder()
        .withPetId(appointmentsForm.pet_id)
        .withService(appointmentsForm.service)
        .withTime(appointmentsForm.time ?? "00:00")
        .withDate(appointmentsForm.date)
        .withDeliverPet(appointmentsForm.deliver_pet)
        .withNotes(appointmentsForm.notes)
        .withPrice(parseMoneyInput(appointmentsForm.price) ?? 0)
        .withPaymentMethod(appointmentsForm.payment_method)
        .withPaid(appointmentsForm.is_paid)
        .withCompleted(appointmentsForm.completed)
        .build();

      if (isEditing) {
        await appointmentController.updateAppointment(
          params!.appointment?.id!,
          appointmentToSave,
        );
      } else {
        await appointmentController.createAppointment(appointmentToSave);
      }
      navigate(Screen.Calendar);
    },
  );

  const closeModal = useCallback(() => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleOpenPetModal = useCallback(() => {
    openSelectionModal({
      title: "Selecionar Pet",
      itemIcon: (pet) => {
        if (pet.species_name === SpeciesCode.Dog)
          return require("../../../assets/animais/caoGreen.png");
        if (pet.species_name === SpeciesCode.Cat)
          return require("../../../assets/animais/gatoGreen.png");
        return require("../../../assets/animais/interrogacaoGreen.png");
      },
      items: petsForm.pets,
      setModalConfig,
      onSelect: (pet) => {
        updateAppointmentsField("pet_id", pet.id);
        updateAppointmentsField("pet_name", pet.name);
        updateAppointmentsField("is_auto", pet.reschedule_active);
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

  const handleChangeService = useCallback(
    (item: any) => updateAppointmentsField("service", item.name),
    [updateAppointmentsField],
  );

  const handleChangeDate = useCallback(
    (v: string) => updateAppointmentsField("date", v),
    [updateAppointmentsField],
  );

  const handleChangeTime = useCallback(
    (v: string) => updateAppointmentsField("time", maskTime(v)),
    [updateAppointmentsField],
  );

  const handleChangeDeliverPet = useCallback(
    (value: number) => updateAppointmentsField("deliver_pet", value),
    [updateAppointmentsField],
  );

  const handleChangeNotes = useCallback(
    (item: string) => updateAppointmentsField("notes", item),
    [updateAppointmentsField],
  );

  const handleChangeCompleted = useCallback(
    (value: number) => updateAppointmentsField("completed", value),
    [updateAppointmentsField],
  );

  const handleChangePrice = useCallback(
    (v: string) => updateAppointmentsField("price", maskMoneyInput(v)),
    [updateAppointmentsField],
  );

  const handleChangePaymentMethod = useCallback(
    (item: any) => updateAppointmentsField("payment_method", item.name),
    [updateAppointmentsField],
  );

  const handleChangePaid = useCallback(
    (value: number) => updateAppointmentsField("is_paid", value),
    [updateAppointmentsField],
  );

  const renderServiceItem = useCallback(
    (item: any) => (
      <Text style={{ padding: SPACING[15], color: colors.TEXT_PRIMARY }}>
        {item.name}
      </Text>
    ),
    [colors.TEXT_PRIMARY],
  );

  const renderPaymentItem = useCallback(
    (item: any) => (
      <Text style={{ padding: SPACING[15], color: colors.TEXT_PRIMARY }}>
        {item.name}
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
    params?.appointment?.notes?.length ?? 0,
  );

  const storedService = appointmentsForm.service
    ? { id: 0, name: appointmentsForm.service }
    : undefined;
  const storedPaymentMethod = appointmentsForm.payment_method
    ? { id: 0, name: appointmentsForm.payment_method }
    : undefined;

  const saveButton = (
    <View style={s.ctnBtnSave}>
      <SaveButton
        isEditing={isEditing}
        isSaving={isSavingRecord}
        onPress={saveAppointment}
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
      <View style={s.choiceItem} accessibilityRole="tablist">
        <ItemSelect
          title="Agendamento"
          isThisSelected={appointmentSelected}
          setSelectValue={() => setAppointmentSelected(true)}
          selectValue={true}
        />
        <ItemSelect
          title="Valores"
          isThisSelected={!appointmentSelected}
          setSelectValue={() => setAppointmentSelected(false)}
          selectValue={false}
        />
      </View>

      {appointmentSelected && (
        <>
          <ScrollView
            contentContainerStyle={s.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.ctnRegistry}>
              <View style={s.requiredFieldBox}>
                <FormSectionTitle title="Dados" />
              </View>
              <View style={s.inputs}>
                <SelectionField
                  image={require("../../../assets/animais/petHome.png")}
                  titleName="PET"
                  selectedRecord={appointmentsForm.pet_name}
                  buttonText="Selecionar Pet"
                  hasBorderBottom={true}
                  onPress={handleOpenPetModal}
                  goEdit={true}
                  isEditable={true}
                />
                <InputSelect
                  image={require("../../../assets/outros/servicos.png")}
                  titleName="Serviço"
                  placeholder="Selecione o serviço..."
                  options={servicesForm.service}
                  itemSelected={
                    servicesForm.service.find(
                      (e) => e.name === appointmentsForm.service,
                    ) ?? storedService
                  }
                  labelExtractor={(item) => item.name}
                  onChange={handleChangeService}
                  renderItem={renderServiceItem}
                  hasBorderBottom={true}
                  isEditable={true}
                />
                <DatePickerField
                  image={require("../../../assets/outros/data.png")}
                  item={appointmentsForm.date}
                  setItem={handleChangeDate}
                  titleName="Data do agendamento"
                  hasBorderBottom={true}
                  isEditable={true}
                />
                <InputInfo
                  image={require("../../../assets/outros/hora.png")}
                  item={appointmentsForm.time}
                  setItem={handleChangeTime}
                  placeholder="Informe o horário..."
                  titleName="Horário"
                  isMultiline={false}
                  inputKeyboardType="numeric"
                  maxChars={MAX_TIME_LENGTH}
                  hasBorderBottom={true}
                />
                <Toggle
                  image={require("../../../assets/outros/entrega.png")}
                  value={appointmentsForm.deliver_pet}
                  onChange={handleChangeDeliverPet}
                  title="Táxi dog"
                  subtitle="Usará Táxi Dog?"
                  hasBorderBottom={true}
                  noEdit={false}
                />
                <InputInfo
                  image={require("../../../assets/nav_bar/artigo.png")}
                  item={appointmentsForm.notes}
                  setItem={handleChangeNotes}
                  placeholder="Uma observação adicional..."
                  titleName="Observações"
                  isMultiline={true}
                  maxChars={observationMaxLength}
                  hasBorderBottom={true}
                />
                {isEditing && (
                  <>
                    <Toggle
                      image={require("../../../assets/outros/concluido.png")}
                      value={appointmentsForm.completed}
                      onChange={handleChangeCompleted}
                      title="Status"
                      subtitle="Serviço concluído?"
                      hasBorderBottom={true}
                    />
                    {appointmentsForm.is_auto == 1 && (
                      <Toggle
                        image={require("../../../assets/outros/auto_gen.png")}
                        value={appointmentsForm.is_auto}
                        onChange={(value) =>
                          updateAppointmentsField("is_auto", value)
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
              {saveButton}
            </View>
          </ScrollView>

          <SelectListModal
            isOpen={modalConfig.visible}
            isPet={true}
            items={modalConfig.items}
            title={modalConfig.title}
            itemIcon={modalConfig.itemIcon}
            onSelect={modalConfig.onSelect}
            onClose={closeModal}
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
          <View style={s.ctnRegistry}>
            <View style={s.requiredFieldBox}>
              <FormSectionTitle title="Dados" />
            </View>
            <View style={s.inputs}>
              <InputInfo
                image={require("../../../assets/outros/valor.png")}
                item={appointmentsForm.price}
                setItem={handleChangePrice}
                placeholder="Valor do serviço..."
                titleName="Valor"
                isMultiline={false}
                inputKeyboardType="numeric"
                maxChars={MAX_MONEY_INPUT_LENGTH}
                hasBorderBottom={true}
              />
              <InputSelect
                image={require("../../../assets/outros/tipo_pgto.png")}
                titleName="Tipo de Pagamento"
                placeholder="Selecione o tipo de pgto..."
                options={paymentMethodsForm.paymentMethods}
                itemSelected={
                  paymentMethodsForm.paymentMethods.find(
                    (e) => e.name === appointmentsForm.payment_method,
                  ) ?? storedPaymentMethod
                }
                labelExtractor={(item) => item.name}
                onChange={handleChangePaymentMethod}
                renderItem={renderPaymentItem}
                hasBorderBottom={true}
                isEditable={true}
              />
              <Toggle
                image={require("../../../assets/outros/pagamento.png")}
                value={appointmentsForm.is_paid}
                onChange={handleChangePaid}
                title="Pagamento"
                subtitle="Cliente Pagou?"
                hasBorderBottom={false}
                noEdit={false}
              />
            </View>
            {saveButton}
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
    choiceItem: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      width: "100%",
      marginTop: SPACING[15],
      marginBottom: SPACING[10],
    },
    ctnRegistry: {
      flex: 1,
      padding: SPACING[20],
      alignItems: "center",
    },
    requiredFieldBox: { width: "100%", height: 28 },
    inputs: {
      width: "100%",
      borderRadius: RADIUS[10],
      borderWidth: 1,
      borderColor: colors.BORDER_LIGHT,
      backgroundColor: colors.BACKGROUND,
      overflow: "hidden",
    },
    ctnBtnSave: { marginTop: SPACING[15] },
  });
