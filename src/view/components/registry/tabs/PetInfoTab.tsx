import { ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import { SpeciesLabel } from "../../../../config/consts";
import {
  MAX_NOTES_LENGTH,
  MAX_PET_NAME_LENGTH,
} from "../../../../globals/limits";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../../theme/ThemeProvider";
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

export type ModalKind = "OWNER" | "BREED";

export interface OpenModalConfig {
  title: string;
  modalKind: ModalKind;
  itemIcon?: ImageSourcePropType;
  items: any[];
  onSelect: (item: any) => void;
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
  sizesList: { id: PetSize; name: string }[];
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

  // --- Busca nome do dono quando não é novo pet e owner_id muda ---
  useEffect(() => {
    if (isNewPet || !form.owner_id) return;

    let cancelled = false;

    ownerController
      .getOwnerById(form.owner_id)
      .then((result) => {
        if (!cancelled && result?.name) {
          updateField("owner_name", result.name);
        }
      })
      .catch(showError);

    return () => {
      cancelled = true;
    };
  }, [isNewPet, form.owner_id]);

  // --- Busca nome da raça quando não é novo pet e raca muda ---
  useEffect(() => {
    if (isNewPet || !form.breed_id) return;

    let cancelled = false;

    speciesController
      .getBreedById(form.breed_id)
      .then((breed) => {
        if (!cancelled) updateField("breed_name", breed.name);
      })
      .catch(showError);

    return () => {
      cancelled = true;
    };
  }, [isNewPet, form.breed_id]);

  // --- Sincroniza porte ao carregar pet existente ---
  useEffect(() => {
    if (isNewPet || !form.size) return;
    const foundSize = sizesList.find((item) => item.id === form.size);
    if (foundSize) updateField("size", foundSize.id);
  }, [isNewPet]);

  // A raça é de uma espécie só: trocar a espécie apaga a raça escolhida, e o pet pede outra ao salvar.
  const handleSelectSpecies = useCallback(
    (item: Species) => {
      if (item.id === form.species_id) return;
      updateField("species_id", item.id);
      updateField("breed_id", 0);
      updateField("breed_name", "");
    },
    [form.species_id, updateField],
  );

  const selectedSpecies = useMemo(
    () => speciesList.find((e) => e.id === form.species_id),
    [speciesList, form.species_id],
  );

  const selectedSize = useMemo(
    () => sizesList.find((item) => item.id === form.size),
    [sizesList, form.size],
  );

  const handleSelectOwner = useCallback(
    (item: any) => {
      updateField("owner_id", item.id);
      updateField("owner_name", item.name);
    },
    [updateField],
  );

  const handleClearOwner = useCallback(() => {
    updateField("owner_id", 0);
    updateField("owner_name", "");
  }, [updateField]);

  const handleOpenOwnerModal = useCallback(() => {
    openModal({
      title: "Selecionar Dono",
      modalKind: "OWNER",
      itemIcon: require("../../../../assets/animais/iconDono.png"),
      items: [],
      onSelect: handleSelectOwner,
    });
  }, [openModal, handleSelectOwner]);

  const handleSelectBreed = useCallback(
    (item: any) => {
      updateField("breed_id", item.id);
      updateField("breed_name", item.name);
    },
    [updateField],
  );

  const handleClearBreed = useCallback(() => {
    updateField("breed_id", 0);
    updateField("breed_name", "");
  }, [updateField]);

  const handleOpenBreedModal = useCallback(() => {
    openModal({
      title: "Selecionar Raça",
      modalKind: "BREED",
      itemIcon: require("../../../../assets/animais/iconPata.png"),
      items: breedsList,
      onSelect: handleSelectBreed,
    });
  }, [openModal, breedsList, handleSelectBreed]);

  const handleBreedCreated = useCallback(
    (id: number, breedName: string) => {
      updateField("breed_id", id);
      updateField("breed_name", breedName);
      setIsBreedFormOpen(false);
    },
    [updateField],
  );

  const handleOpenBreedForm = useCallback(
    () => setIsBreedFormOpen(true),
    [],
  );
  const handleCloseBreedForm = useCallback(
    () => setIsBreedFormOpen(false),
    [],
  );

  const renderSpeciesItem = useCallback(
    (item: any) => (
      <Text style={{ padding: SPACING[15], color: colors.TEXT_PRIMARY }}>
        {
          SpeciesLabel[
            item.name as keyof typeof SpeciesLabel
          ]
        }
      </Text>
    ),
    [colors.TEXT_PRIMARY],
  );

  const renderSizeItem = useCallback(
    (item: any) => (
      <Text style={{ padding: SPACING[15], color: colors.TEXT_PRIMARY }}>
        {item.name}
      </Text>
    ),
    [colors.TEXT_PRIMARY],
  );

  const speciesLabelExtractor = useCallback(
    (item: any) =>
      SpeciesLabel[item.name as keyof typeof SpeciesLabel],
    [],
  );

  const sizeLabelExtractor = useCallback((item: any) => item.name, []);

  if (visible == false) {
    return;
  }

  return (
    <>
      <View style={s.inputs}>
        <InputInfo
          image={require("../../../../assets/animais/iconNome.png")}
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
          image={require("../../../../assets/animais/iconDono.png")}
          titleName="Dono"
          selectedRecord={form.owner_name}
          buttonText={form.owner_name ? "Trocar dono" : "Selecionar dono"}
          hasBorderBottom={true}
          onPress={handleOpenOwnerModal}
          onClear={handleClearOwner}
          goEdit={true}
          isEditable={isEditable}
        />

        <InputSelect
          titleName="Espécie"
          image={require("../../../../assets/animais/iconEspecie.png")}
          placeholder="Selecione a espécie..."
          options={speciesList}
          itemSelected={selectedSpecies}
          labelExtractor={speciesLabelExtractor}
          onChange={handleSelectSpecies}
          renderItem={renderSpeciesItem}
          hasBorderBottom={true}
          isEditable={isEditable}
        />

        {form.species_id ? (
          <SelectionField
            image={require("../../../../assets/animais/iconRaca.png")}
            titleName="Raça"
            selectedRecord={form.breed_name}
            buttonText={form.breed_name ? "Trocar raça" : "Selecionar raça"}
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
          image={require("../../../../assets/animais/iconPorte.png")}
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
          image={require("../../../../assets/nav_bar/artigo.png")}
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
