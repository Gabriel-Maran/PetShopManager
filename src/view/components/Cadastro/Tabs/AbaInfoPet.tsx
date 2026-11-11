import { ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import { EspeciesAtendidasLabel } from "../../../../config/consts";
import {
  MAX_NOTES_LENGTH,
  MAX_PET_NAME_LENGTH,
} from "../../../../globals/limits";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../../Themes/ThemeProvider";
import InputInfo from "../../Cadastro/InputInfo";
import InputSelect from "../../InputSelect";
import SelectionField from "../../Cadastro/SelectionField";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ownerController } from "../../../../controller/OwnerController";
import { speciesController } from "../../../../controller/SpeciesController";
import ModalCadastroRaca from "../Modal/ModalCreateRacePet";
import { useError } from "../../../../hooks/useError";
import type { UpdateField } from "../../../../hooks/useFormState";
import type { PorteAnimal } from "../../../../config/petEnums";
import type { Breed } from "../../../../model/Breed";
import type { Species } from "../../../../repository/SpeciesRepository";
import type { PetForm } from "../../../pages/Pet/petForm";
import { RADIUS, SPACING } from "../../../Themes/tokens";

export type TipoModal = "DONO" | "RACA";

export interface AbrirModalConfig {
  titulo: string;
  tipoModal: TipoModal;
  itemIcon?: ImageSourcePropType;
  lista: any[];
  aoSelecionar: (item: any) => void;
}

interface AbaInfoPetProps {
  visible: boolean;
  isEditavel?: boolean;
  isNewPet: boolean;
  form: PetForm;
  updateField: UpdateField<PetForm>;
  abrirModal: (config: AbrirModalConfig) => void;
  especiesList: Species[];
  racasList: Breed[];
  portesList: { id: PorteAnimal; nome: string }[];
}

export default function AbaInfoPet({
  visible = true,
  isEditavel = true,
  isNewPet,
  form,
  updateField,
  abrirModal,
  especiesList,
  racasList,
  portesList,
}: AbaInfoPetProps) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  const { showError } = useError();

  const [racaModalAberto, setRacaModalAberto] = useState(false);

  // O campo não corta a observação já gravada: com a nota da migração ela pode passar do limite. Ela
  // abre inteira, e salvar sem mudar vale; o que for editado volta a respeitar o limite (schema).
  const [notesMaxLength] = useState(() => Math.max(MAX_NOTES_LENGTH, form.observacoes.length));

  // --- Busca nome do dono quando não é novo pet e dono_id muda ---
  useEffect(() => {
    if (isNewPet || !form.dono_id) return;

    let cancelled = false;

    ownerController
      .getOwnerById(form.dono_id)
      .then((resultado) => {
        if (!cancelled && resultado?.nome) {
          updateField("dono_nome", resultado.nome);
        }
      })
      .catch(showError);

    return () => {
      cancelled = true;
    };
  }, [isNewPet, form.dono_id]);

  // --- Busca nome da raça quando não é novo pet e raca muda ---
  useEffect(() => {
    if (isNewPet || !form.raca) return;

    let cancelled = false;

    speciesController
      .getBreedById(form.raca)
      .then((raca) => {
        if (!cancelled) updateField("raca_nome", raca.nome_raca);
      })
      .catch(showError);

    return () => {
      cancelled = true;
    };
  }, [isNewPet, form.raca]);

  // --- Sincroniza porte ao carregar pet existente ---
  useEffect(() => {
    if (isNewPet || !form.porte) return;
    const porteEncontrado = portesList.find((item) => item.id === form.porte);
    if (porteEncontrado) updateField("porte", porteEncontrado.id);
  }, [isNewPet]);

  // A raça é de uma espécie só: trocar a espécie apaga a raça escolhida, e o pet pede outra ao salvar.
  const handleSelecionarEspecie = useCallback(
    (item: Species) => {
      if (item.id === form.especie) return;
      updateField("especie", item.id);
      updateField("raca", 0);
      updateField("raca_nome", "");
    },
    [form.especie, updateField],
  );

  const especieSelecionada = useMemo(
    () => especiesList.find((e) => e.id === form.especie),
    [especiesList, form.especie],
  );

  const porteSelecionado = useMemo(
    () => portesList.find((item) => item.id === form.porte),
    [portesList, form.porte],
  );

  const handleSelecionarDono = useCallback(
    (item: any) => {
      updateField("dono_id", item.id);
      updateField("dono_nome", item.nome);
    },
    [updateField],
  );

  const handleLimparDono = useCallback(() => {
    updateField("dono_id", 0);
    updateField("dono_nome", "");
  }, [updateField]);

  const handleAbrirModalDono = useCallback(() => {
    abrirModal({
      titulo: "Selecionar Dono",
      tipoModal: "DONO",
      itemIcon: require("../../../../assets/animais/iconDono.png"),
      lista: [],
      aoSelecionar: handleSelecionarDono,
    });
  }, [abrirModal, handleSelecionarDono]);

  const handleSelecionarRaca = useCallback(
    (item: any) => {
      updateField("raca", item.id);
      updateField("raca_nome", item.nome);
    },
    [updateField],
  );

  const handleLimparRaca = useCallback(() => {
    updateField("raca", 0);
    updateField("raca_nome", "");
  }, [updateField]);

  const handleAbrirModalRaca = useCallback(() => {
    abrirModal({
      titulo: "Selecionar Raça",
      tipoModal: "RACA",
      itemIcon: require("../../../../assets/animais/iconPata.png"),
      lista: racasList,
      aoSelecionar: handleSelecionarRaca,
    });
  }, [abrirModal, racasList, handleSelecionarRaca]);

  const handleRacaCriada = useCallback(
    (id: number, nomeRaca: string) => {
      updateField("raca", id);
      updateField("raca_nome", nomeRaca);
      setRacaModalAberto(false);
    },
    [updateField],
  );

  const handleAbrirCadastroRaca = useCallback(
    () => setRacaModalAberto(true),
    [],
  );
  const handleFecharCadastroRaca = useCallback(
    () => setRacaModalAberto(false),
    [],
  );

  const renderEspecieItem = useCallback(
    (item: any) => (
      <Text style={{ padding: SPACING[15], color: colors.TEXT_PRIMARY }}>
        {
          EspeciesAtendidasLabel[
            item.nome as keyof typeof EspeciesAtendidasLabel
          ]
        }
      </Text>
    ),
    [colors.TEXT_PRIMARY],
  );

  const renderPorteItem = useCallback(
    (item: any) => (
      <Text style={{ padding: SPACING[15], color: colors.TEXT_PRIMARY }}>
        {item.nome}
      </Text>
    ),
    [colors.TEXT_PRIMARY],
  );

  const labelExtractorEspecie = useCallback(
    (item: any) =>
      EspeciesAtendidasLabel[item.nome as keyof typeof EspeciesAtendidasLabel],
    [],
  );

  const labelExtractorPorte = useCallback((item: any) => item.nome, []);

  if (visible == false) {
    return;
  }

  return (
    <>
      <View style={s.inputs}>
        <InputInfo
          image={require("../../../../assets/animais/iconNome.png")}
          item={form.nome}
          setItem={(v) => updateField("nome", v)}
          placeHolder="Digite o nome..."
          titleName="Nome do Pet"
          variasLinhas={false}
          hasBorderBottom={true}
          maximoCaracteres={MAX_PET_NAME_LENGTH}
          digitavel={isEditavel}
        />

        <SelectionField
          image={require("../../../../assets/animais/iconDono.png")}
          titleName="Dono"
          selectedReg={form.dono_nome}
          buttonText={form.dono_nome ? "Trocar dono" : "Selecionar dono"}
          hasBorderBottom={true}
          onPress={handleAbrirModalDono}
          onClear={handleLimparDono}
          goEdit={true}
          isEditavel={isEditavel}
        />

        <InputSelect
          titleName="Espécie"
          image={require("../../../../assets/animais/iconEspecie.png")}
          placeholder="Selecione a espécie..."
          itens={especiesList}
          itemSelected={especieSelecionada}
          labelExtractor={labelExtractorEspecie}
          onChange={handleSelecionarEspecie}
          renderItem={renderEspecieItem}
          hasBorderBottom={true}
          isEditavel={isEditavel}
        />

        {form.especie ? (
          <SelectionField
            image={require("../../../../assets/animais/iconRaca.png")}
            titleName="Raça"
            selectedReg={form.raca_nome}
            buttonText={form.raca_nome ? "Trocar raça" : "Selecionar raça"}
            hasBorderBottom={true}
            onPress={handleAbrirModalRaca}
            onClear={handleLimparRaca}
            goEdit={true}
            isEditavel={isEditavel}
            fazCadastro={isEditavel}
            onCadastro={handleAbrirCadastroRaca}
          />
        ) : null}

        <InputSelect
          titleName="Porte"
          image={require("../../../../assets/animais/iconPorte.png")}
          placeholder="Selecione o Porte do animal"
          itens={portesList}
          itemSelected={porteSelecionado}
          labelExtractor={labelExtractorPorte}
          onChange={(item) => updateField("porte", item.id)}
          renderItem={renderPorteItem}
          hasBorderBottom={true}
          isEditavel={isEditavel}
        />

        <InputInfo
          image={require("../../../../assets/nav_bar/artigo.png")}
          item={form.observacoes}
          setItem={(v) => updateField("observacoes", v)}
          placeHolder="Uma observação adicional..."
          titleName="Observações"
          variasLinhas={true}
          digitavel={isEditavel}
          maximoCaracteres={notesMaxLength}
          hasBorderBottom={false}
        />
      </View>

      <ModalCadastroRaca
        isOpen={racaModalAberto}
        onClose={handleFecharCadastroRaca}
        especiesList={especiesList}
        onSuccess={handleRacaCriada}
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
