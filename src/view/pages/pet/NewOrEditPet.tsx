import { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  ImageSourcePropType,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

import {
  isPackageFrequency,
  isPetSize,
  PetSize,
  Screen,
  ServiceName,
  PetSizeLabel,
  RegistryParams,
} from "../../../config/consts";

import { todayIso } from "../../../utils/dates";
import { formatMoneyInput, parseMoneyInput } from "../../../utils/money";

import { useAsyncAction } from "../../../hooks/useAsyncAction";
import { useScreen } from "../../../hooks/useScreen";
import { useOwners, useBreeds } from "../../../hooks/data/usePet";
import useFormState from "../../../hooks/useFormState";

import { ThemeColors, useTheme, useThemedStyles } from "../../theme/ThemeProvider";

import { PetBuilder } from "../../../model/Pet";
import { petController } from "../../../controller/PetController";

import TitleBar from "../../components/registry/TitleBar";
import DefaultHeader from "../../components/header/DefaultHeader";
import SelectListModal from "../../components/registry/modal/SelectListModal";
import ItemSelect from "../../components/registry/ItemSelect";
import SaveButton from "../../components/registry/SaveButton";
import PetInfoTab, { OpenModalConfig } from "../../components/registry/tabs/PetInfoTab";
import PetScheduleTab from "../../components/registry/tabs/PetScheduleTab";
import type { PetForm } from "./petForm";
import { SPACING } from "../../theme/tokens";

import type { SelectableItem } from "../../../utils/openSelectionModal";

const sizesList = Object.values(PetSize).map((size) => ({
  id: size,
  name: PetSizeLabel[size],
}));

// Os nomes do dono e da raça são buscados a partir dos ids ao abrir a edição; mudam sem o usuário mexer.
const DERIVED_FIELDS = ["ownerName", "breedName"] as const;

const INITIAL_MODAL = {
  visible: false,
  title: "",
  itemIcon: undefined as ImageSourcePropType | undefined,
  items: [] as SelectableItem[],
  modalKind: "" as "OWNER" | "BREED" | "",
  onSelect: (_item: SelectableItem) => {},
};

export default function NewOrEditPet() {
  const [isPetTabSelected, setIsPetTabSelected] = useState(true);
  const { params, navigate } = useScreen<RegistryParams>();

  const isViewing = params?.mode === "view";
  const isEditing = params?.mode === "edit";
  const isNewPet = !params?.pet?.id;

  const s = useThemedStyles(styles);
  const { colors } = useTheme();

  const savedPackage = params?.pet?.package_frequency;
  const { form, updateField, isDirty } = useFormState<PetForm>(
    {
      name: params?.pet?.name ?? "",
      speciesId: params?.pet?.species_id ?? 0,
      ownerId: params?.pet?.owner_id ?? 0,
      ownerName: "",
      breedId: params?.pet?.breed_id ?? 0,
      breedName: params?.pet?.breed_name ?? "",
      notes: params?.pet?.notes ?? "",
      defaultService: params?.pet?.default_service ?? ServiceName.Bath,
      rescheduleActive: Boolean(params?.pet?.reschedule_active ?? false),
      packagePrice: formatMoneyInput(params?.pet?.package_price),
      size: isPetSize(params?.pet?.size) ? params.pet.size : PetSize.Medium,
      packageFrequency: isPackageFrequency(savedPackage) ? savedPackage : undefined,
      packageStartDate: params?.pet?.package_start_date ?? todayIso(),
      defaultTime: params?.pet?.default_time ?? "",
    },
    { ignoredWhenComparing: DERIVED_FIELDS },
  );

  const {
    breedsList,
    speciesList,
    page: breedPage,
    setPage: setBreedPage,
    setSearchTxt: setBreedSearchTxt,
    total: breedTotal,
  } = useBreeds(form.speciesId);

  const {
    owners,
    page: ownerPage,
    setPage: setOwnerPage,
    setSearchTxt: setOwnerSearchTxt,
    total: ownerTotal,
  } = useOwners();

  const [modalConfig, setModalConfig] = useState(INITIAL_MODAL);

  // Dentro da ação: um valor digitado fora do formato vira a mensagem de erro da tela.
  const { run: savePet, isRunning: isSavingRecord } = useAsyncAction(async () => {
    // Com a remarcação desligada, o pacote vai vazio: nem a sobra de quando ela estava ligada nem
    // um valor mal digitado, que nem aparece mais na tela, chegam ao banco.
    const pkg = form.rescheduleActive
      ? {
          frequency: form.packageFrequency,
          start: form.packageStartDate ?? todayIso(),
          price: parseMoneyInput(form.packagePrice),
        }
      : { frequency: null, start: null, price: null };

    const petToSave = new PetBuilder()
      .withName(form.name)
      .withSpecies(form.speciesId)
      .withSize(form.size)
      .forOwner(form.ownerId)
      .withBreed(form.breedId)
      .withNotes(form.notes)
      .withDefaultService(form.defaultService)
      .withRescheduleActive(form.rescheduleActive ? 1 : 0)
      .withPackage(pkg.frequency)
      .withPackageStart(pkg.start)
      .withDefaultTime(form.defaultTime || "00:00")
      .withPackagePrice(pkg.price)
      .build();

    if (params?.pet?.id) {
      await petController.updatePet(params.pet.id, petToSave);
    } else {
      await petController.createPet(petToSave);
    }
    navigate(Screen.Registry, {
      type: "PET",
      mode: "view",
    } as RegistryParams);
  });

  const openModal = useCallback(
    ({ title, items, itemIcon, modalKind, onSelect }: OpenModalConfig) => {
      setModalConfig({
        visible: true,
        title,
        itemIcon,
        modalKind,
        items: modalKind === "OWNER" ? (owners ?? []) : items,
        onSelect: (item) => {
          onSelect(item);
          setModalConfig((prev) => ({ ...prev, visible: false }));
        },
      });
    },
    [owners],
  );

  const closeModal = useCallback(() => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  // Sem isso, a lista do modal fica congelada no momento em que ele abriu, sem a busca nem a paginação.
  useEffect(() => {
    if (modalConfig.visible && modalConfig.modalKind === "OWNER") {
      setModalConfig((prev) => ({ ...prev, items: owners ?? [] }));
    }
  }, [owners, modalConfig.visible, modalConfig.modalKind]);

  useEffect(() => {
    if (modalConfig.visible && modalConfig.modalKind === "BREED") {
      setModalConfig((prev) => ({ ...prev, items: breedsList ?? [] }));
    }
  }, [breedsList, modalConfig.visible, modalConfig.modalKind]);

  const handleSetSearch = useCallback(
    (txt: string) => {
      if (modalConfig.modalKind === "OWNER") {
        setOwnerPage(0);
        setOwnerSearchTxt(txt);
      } else if (modalConfig.modalKind === "BREED") {
        setBreedPage(0);
        setBreedSearchTxt(txt);
      }
    },
    [modalConfig.modalKind, setOwnerPage, setOwnerSearchTxt, setBreedPage, setBreedSearchTxt],
  );

  const isOwnerModal = modalConfig.modalKind === "OWNER";
  const isBreedModal = modalConfig.modalKind === "BREED";

  const pageModal = isOwnerModal ? ownerPage : isBreedModal ? breedPage : 0;
  const totalModal = isOwnerModal
    ? ownerTotal
    : isBreedModal
      ? breedTotal
      : modalConfig.items.length;
  const setPageModal = isOwnerModal ? setOwnerPage : isBreedModal ? setBreedPage : () => {};

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <DefaultHeader />

      <View style={{ backgroundColor: colors.THIRD_BACKGROUND }}>
        <TitleBar
          title={isEditing ? "Editar Pet" : isViewing ? "Visualizando Pet" : "Novo Pet"}
          subtitle="Preencha os dados do pet"
          isViewing={isViewing}
          hasUnsavedChanges={isDirty}
        />
        <View style={s.choiceItem} accessibilityRole="tablist">
          <ItemSelect
            title="Pet"
            isThisSelected={isPetTabSelected}
            setSelectValue={() => setIsPetTabSelected(true)}
            selectValue={true}
          />
          <ItemSelect
            title="Agendamento"
            isThisSelected={!isPetTabSelected}
            setSelectValue={() => setIsPetTabSelected(false)}
            selectValue={false}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={s.ctnRegistry}>
          <View style={{ display: isPetTabSelected ? "flex" : "none" }}>
            <PetInfoTab
              isEditable={!isViewing}
              form={form}
              isNewPet={isNewPet}
              updateField={updateField}
              sizesList={sizesList}
              speciesList={speciesList}
              breedsList={breedsList ?? []}
              openModal={openModal}
              visible={isPetTabSelected}
            />
          </View>

          <View style={{ display: !isPetTabSelected ? "flex" : "none" }}>
            <PetScheduleTab
              isEditable={!isViewing}
              form={form}
              updateField={updateField}
              visible={!isPetTabSelected}
            />
          </View>
          {!isViewing && (
            <View style={s.ctnBtnSave}>
              <SaveButton isEditing={isEditing} isSaving={isSavingRecord} onPress={savePet} />
            </View>
          )}
        </View>
      </ScrollView>

      <SelectListModal
        isOpen={modalConfig.visible}
        items={modalConfig.items}
        title={modalConfig.title}
        itemIcon={modalConfig.itemIcon}
        onSelect={modalConfig.onSelect}
        onClose={closeModal}
        page={pageModal}
        total={totalModal}
        setPage={setPageModal}
        setSearch={handleSetSearch}
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
    ctnRegistry: {
      flex: 1,
      padding: SPACING[20],
      alignItems: "center",
    },
    choiceItem: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: SPACING[10],
    },
    ctnBtnSave: {
      marginTop: SPACING[15],
    },
  });
