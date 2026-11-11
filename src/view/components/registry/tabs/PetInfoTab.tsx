import { ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import { SpeciesLabel } from "../../../../config/consts";
import { MAX_NOTES_LENGTH, MAX_PET_NAME_LENGTH } from "../../../../globals/limits";
import { ThemeColors, useTheme, useThemedStyles } from "../../../theme/ThemeProvider";
import InputInfo from "../InputInfo";
import InputSelect from "../../InputSelect";
import SelectionField from "../SelectionField";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ownerController } from "../../../../controller/OwnerController";
import { speciesController } from "../../../../controller/SpeciesController";
import CreateBreedModal from "../modal/CreateBreedModal";
import { useError } from "../../../../hooks/useError";
import type { UpdateField } from "../../../../hooks/useFormState";
import type { PetSize } from "../../../../config/petEnums";
import type { Breed } from "../../../../model/Breed";
import type { Species } from "../../../../repository/SpeciesRepository";
import type { PetForm } from "../../../pages/pet/petForm";
import { RADIUS, SPACING } from "../../../theme/tokens";

import type { SelectableItem } from "../../../../utils/openSelectionModal";

export type ModalKind = "OWNER" | "BREED";

/** Um porte na lista do formulário: o código gravado e o rótulo. */
export interface SizeOption {
  id: PetSize;
  name: string;
}

export interface OpenModalConfig {
  title: string;
  modalKind: ModalKind;
  itemIcon?: ImageSourcePropType;
  items: SelectableItem[];
  onSelect: (item: SelectableItem) => void;
}

interface PetInfoTabProps {
  visible: boolean;
  isEditable?: boolean;
  isNewPet: boolean;
  form: PetForm;
  updateField: UpdateField<PetForm>;
  openModal: (config: OpenModalConfig) => void;
  speciesList: Species[];
  breedsList: Breed[];
  sizesList: SizeOption[];
}

export default function PetInfoTab({
  visible = true,
  isEditable = true,
  isNewPet,
  form,
  updateField,
  openModal,
  speciesList,
  breedsList,
  sizesList,
}: PetInfoTabProps) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  const { showError } = useError();

  const [isBreedFormOpen, setIsBreedFormOpen] = useState(false);

  // O campo não corta a observação já gravada: com a nota da migração ela pode passar do limite. Ela
  // abre inteira, e salvar sem mudar vale; o que for editado volta a respeitar o limite (schema).
  const [notesMaxLength] = useState(() => Math.max(MAX_NOTES_LENGTH, form.notes.length));

  // --- Busca nome do dono quando não é novo pet e o dono muda ---
  useEffect(() => {
    if (isNewPet || !form.ownerId) return;

    let cancelled = false;

    ownerController
      .getOwnerById(form.ownerId)
      .then((result) => {
        if (!cancelled && result?.name) {
          updateField("ownerName", result.name);
        }
      })
      .catch(showError);

    return () => {
      cancelled = true;
    };
  }, [isNewPet, form.ownerId, showError, updateField]);

  // --- Busca nome da raça quando não é novo pet e a raça muda ---
  useEffect(() => {
    if (isNewPet || !form.breedId) return;

    let cancelled = false;

    speciesController
      .getBreedById(form.breedId)
      .then((breed) => {
        if (!cancelled) updateField("breedName", breed.name);
      })
      .catch(showError);

    return () => {
      cancelled = true;
    };
  }, [isNewPet, form.breedId, showError, updateField]);

  // A raça é de uma espécie só: trocar a espécie apaga a raça escolhida, e o pet pede outra ao salvar.
  const handleSelectSpecies = useCallback(
    (item: Species) => {
      if (item.id === form.speciesId) return;
      updateField("speciesId", item.id);
      updateField("breedId", 0);
      updateField("breedName", "");
    },
    [form.speciesId, updateField],
  );

  const selectedSpecies = useMemo(
    () => speciesList.find((e) => e.id === form.speciesId),
    [speciesList, form.speciesId],
  );

  const selectedSize = useMemo(
    () => sizesList.find((item) => item.id === form.size),
    [sizesList, form.size],
  );

  const handleSelectOwner = useCallback(
    (item: SelectableItem) => {
      updateField("ownerId", item.id ?? 0);
      updateField("ownerName", item.name);
    },
    [updateField],
  );

  const handleClearOwner = useCallback(() => {
    updateField("ownerId", 0);
    updateField("ownerName", "");
  }, [updateField]);

  const handleOpenOwnerModal = useCallback(() => {
    openModal({
      title: "Selecionar Dono",
      modalKind: "OWNER",
      itemIcon: require("../../../../assets/animals/iconOwner.png"),
      items: [],
      onSelect: handleSelectOwner,
    });
  }, [openModal, handleSelectOwner]);

  const handleSelectBreed = useCallback(
    (item: SelectableItem) => {
      updateField("breedId", item.id ?? 0);
      updateField("breedName", item.name);
    },
    [updateField],
  );

  const handleClearBreed = useCallback(() => {
    updateField("breedId", 0);
    updateField("breedName", "");
  }, [updateField]);

  const handleOpenBreedModal = useCallback(() => {
    openModal({
      title: "Selecionar Raça",
      modalKind: "BREED",
      itemIcon: require("../../../../assets/animals/iconPaw.png"),
      items: breedsList,
      onSelect: handleSelectBreed,
    });
  }, [openModal, breedsList, handleSelectBreed]);

  const handleBreedCreated = useCallback(
    (id: number, breedName: string) => {
      updateField("breedId", id);
      updateField("breedName", breedName);
      setIsBreedFormOpen(false);
    },
    [updateField],
  );

  const handleOpenBreedForm = useCallback(() => setIsBreedFormOpen(true), []);
  const handleCloseBreedForm = useCallback(() => setIsBreedFormOpen(false), []);

  const renderSpeciesItem = useCallback(
    (item: Species) => (
      <Text style={{ padding: SPACING[15], color: colors.TEXT_PRIMARY }}>
        {SpeciesLabel[item.name as keyof typeof SpeciesLabel]}
      </Text>
    ),
    [colors.TEXT_PRIMARY],
  );

  const renderSizeItem = useCallback(
    (item: SizeOption) => (
      <Text style={{ padding: SPACING[15], color: colors.TEXT_PRIMARY }}>{item.name}</Text>
    ),
    [colors.TEXT_PRIMARY],
  );

  const speciesLabelExtractor = useCallback(
    (item: Species) => SpeciesLabel[item.name as keyof typeof SpeciesLabel],
    [],
  );

  const sizeLabelExtractor = useCallback((item: SizeOption) => item.name, []);

  if (!visible) {
    return;
  }

  return (
    <>
      <View style={s.inputs}>
        <InputInfo
          image={require("../../../../assets/animals/iconName.png")}
          item={form.name}
          setItem={(v) => updateField("name", v)}
          placeholder="Digite o nome..."
          titleName="Nome do Pet"
          isMultiline={false}
          hasBorderBottom={true}
          maxChars={MAX_PET_NAME_LENGTH}
          isTypeable={isEditable}
        />

        <SelectionField
          image={require("../../../../assets/animals/iconOwner.png")}
          titleName="Dono"
          selectedRecord={form.ownerName}
          buttonText={form.ownerName ? "Trocar dono" : "Selecionar dono"}
          hasBorderBottom={true}
          onPress={handleOpenOwnerModal}
          onClear={handleClearOwner}
          goEdit={true}
          isEditable={isEditable}
        />

        <InputSelect
          titleName="Espécie"
          image={require("../../../../assets/animals/iconSpecies.png")}
          placeholder="Selecione a espécie..."
          options={speciesList}
          itemSelected={selectedSpecies}
          labelExtractor={speciesLabelExtractor}
          onChange={handleSelectSpecies}
          renderItem={renderSpeciesItem}
          hasBorderBottom={true}
          isEditable={isEditable}
        />

        {form.speciesId ? (
          <SelectionField
            image={require("../../../../assets/animals/iconBreed.png")}
            titleName="Raça"
            selectedRecord={form.breedName}
            buttonText={form.breedName ? "Trocar raça" : "Selecionar raça"}
            hasBorderBottom={true}
            onPress={handleOpenBreedModal}
            onClear={handleClearBreed}
            goEdit={true}
            isEditable={isEditable}
            canRegister={isEditable}
            onRegister={handleOpenBreedForm}
          />
        ) : null}

        <InputSelect
          titleName="Porte"
          image={require("../../../../assets/animals/iconSize.png")}
          placeholder="Selecione o Porte do animal"
          options={sizesList}
          itemSelected={selectedSize}
          labelExtractor={sizeLabelExtractor}
          onChange={(item) => updateField("size", item.id)}
          renderItem={renderSizeItem}
          hasBorderBottom={true}
          isEditable={isEditable}
        />

        <InputInfo
          image={require("../../../../assets/nav_bar/article.png")}
          item={form.notes}
          setItem={(v) => updateField("notes", v)}
          placeholder="Uma observação adicional..."
          titleName="Observações"
          isMultiline={true}
          isTypeable={isEditable}
          maxChars={notesMaxLength}
          hasBorderBottom={false}
        />
      </View>

      <CreateBreedModal
        isOpen={isBreedFormOpen}
        onClose={handleCloseBreedForm}
        speciesList={speciesList}
        onSuccess={handleBreedCreated}
      />
    </>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    inputs: {
      width: "100%",
      borderRadius: RADIUS[10],
      borderWidth: 1,
      borderColor: colors.BORDER_LIGHT,
      backgroundColor: colors.BACKGROUND,
      overflow: "hidden",
    },
  });
