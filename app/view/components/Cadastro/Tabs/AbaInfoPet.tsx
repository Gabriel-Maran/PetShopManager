import { ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import { EspeciesAtendidasLabel } from "../../../../config/consts";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../../Themes/ThemeProvider";
import InputInfo from "../../Cadastro/InputInfo";
import InputSelect from "../../InputSelect";
import SelectionField from "../../Cadastro/SelectionField";
import { Pet } from "../../../../model/Pet";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ownerController } from "../../../../controller/OwnerController";
import { raceRepository } from "../../../../repository/RaceRepository";
import ModalCadastroRaca from "../Modal/ModalCreateRacePet";
import { pegarRacasBanco } from "../../../../hooks/buscaBanco/usePet";

interface AbaInfoPetProps {
  isEditavel?: boolean;
  isNewPet: boolean;
  form: {
    nome: string;
    especie: number;
    dono_id: number;
    dono_nome: string;
    raca: number;
    raca_nome: string;
    observacoes: string;
    porte: string;
  };
  updateField: (field: string, value: any) => void;
  abrirModal: (config: {
    titulo: string;
    itemIcon?: ImageSourcePropType;
    lista: any[];
    aoSelecionar: (item: any) => void;
  }) => void;
  rList: any[];
  especiesList: any[];
  portesList: { id: string; nome: string }[];
  petToEdit?: Pet;
  salvarPet: () => void;
}

export default function AbaInfoPet({
  isEditavel = true,
  isNewPet,
  form,
  updateField,
  abrirModal,
  rList,
  especiesList,
  portesList,
  petToEdit,
  salvarPet,
}: AbaInfoPetProps) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();

  const [racaModalAberto, setRacaModalAberto] = useState(false);

  const { racasList } = pegarRacasBanco(form.especie);

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
      .catch((error) => console.error("Erro ao buscar dono:", error));

    return () => {
      cancelled = true;
    };
  }, [isNewPet, form.dono_id]);

  // --- Busca nome da raça quando não é novo pet e raca muda ---
  useEffect(() => {
    if (isNewPet || !form.raca) return;

    let cancelled = false;

    raceRepository
      .findRaceById(form.raca)
      .then((resultado) => {
        if (!cancelled && resultado?.nome_raca) {
          updateField("raca_nome", resultado.nome_raca);
        }
      })
      .catch((error) => console.error("Erro ao buscar raça:", error));

    return () => {
      cancelled = true;
    };
  }, [isNewPet, form.raca]);

  // --- Sincroniza porte ao carregar pet existente ---
  useEffect(() => {
    if (isNewPet || !form.porte) return;

    const porteEncontrado = portesList.find((item) => item.id === form.porte);
    if (porteEncontrado) {
      updateField("porte", porteEncontrado.id);
    }
  }, [isNewPet]);

  // --- Limpa raça ao trocar espécie ---
  useEffect(() => {
    updateField("raca_nome", "");
  }, [form.especie]);

  // --- Memoização dos itens selecionados para evitar .find() a cada render ---
  const especieSelecionada = useMemo(
    () => especiesList.find((e) => e.id === form.especie),
    [especiesList, form.especie],
  );

  const porteSelecionado = useMemo(
    () => portesList.find((item) => item.id === form.porte),
    [portesList, form.porte],
  );

  // --- Callbacks memoizados para evitar re-renders desnecessários nos filhos ---
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
      itemIcon: require("../../../../assets/animais/iconPata.png"),
      lista: racasList ?? [],
      aoSelecionar: handleSelecionarRaca,
    });
  }, [abrirModal, racasList, handleSelecionarRaca]);

  const handleRacaCriada = useCallback(
    (id: number, nomeRaca: string, _especieId: number) => {
      updateField("raca", id);
      updateField("raca_nome", nomeRaca);
      setRacaModalAberto(false);
    },
    [updateField],
  );

  const handleAbrirCadastroRaca = useCallback(() => {
    setRacaModalAberto(true);
  }, []);

  const handleFecharCadastroRaca = useCallback(() => {
    setRacaModalAberto(false);
  }, []);

  const renderEspecieItem = useCallback(
    (item: any) => (
      <Text style={{ padding: 15, color: colors.TEXT_PRIMARY }}>
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
      <Text style={{ padding: 15, color: colors.TEXT_PRIMARY }}>
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
          maximoCaracteres={25}
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
          onChange={(item) => updateField("especie", item.id)}
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
          maximoCaracteres={250}
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
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.BORDER_LIGHT,
      backgroundColor: colors.BACKGROUND,
      overflow: "hidden",
    },
  });
