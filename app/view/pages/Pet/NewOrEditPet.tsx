import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import {
  COLORS,
  LIMIT_ITEM_PAGE,
  ORDER,
  PacoteRemarcacao,
  PorteAnimal,
  Screen,
  TipoServico,
} from "../../../config/consts";
import { useError } from "../../../hooks/useError";
import { Pet, PetBuilder } from "../../../model/Pet";
import { petController } from "../../../controller/PetController";
import { Owner } from "../../../model/Owner";

import TitleBar from "../../components/Cadastro/TitleBar";
import DefaultHeader from "../../components/Header/DefaultHeader";
import InputInfo from "../../components/Cadastro/InputInfo";
import SelectionField from "../../components/Cadastro/SelectionField";
import { ownerController } from "../../../controller/OwnerController";
import ModalSelectList from "../../components/Cadastro/Modal/ModalSelectList";
import { speciesController } from "../../../controller/SpeciesController";
import InputSelect from "../../components/InputSelect";

export default function NewOrEditPet({ petToEdit }: { petToEdit?: Pet }) {
  const { showError } = useError();

  const [form, setForm] = useState({
    nome: petToEdit?.nome ?? "",
    especie: petToEdit?.especie ?? 0,
    dono_id: petToEdit?.dono_id ?? 0,
    dono_nome: "",
    raca: petToEdit?.raca ?? 0,
    observacoes: petToEdit?.observacoes ?? "",
    servicoPadrao: petToEdit?.servico_padrao ?? TipoServico.Banho,
    remarcAtiva: petToEdit?.remarcacao_ativa ?? false,
    porte:
      petToEdit?.porte && petToEdit.porte in PorteAnimal
        ? (petToEdit.porte as PorteAnimal)
        : PorteAnimal.MEDIO,
    pacoteRemarcacao:
      petToEdit?.pacote_remarcacao &&
      petToEdit.pacote_remarcacao in PacoteRemarcacao
        ? (petToEdit.pacote_remarcacao as PacoteRemarcacao)
        : undefined,
    dataInicioPacote: petToEdit?.data_inicio_pacote ?? undefined,
  });

  const salvarPet = async () => {
    const petSalvar = new PetBuilder()
      .withNome(form.nome)
      .withEspecie(form.especie)
      .withPorte(form.porte)
      .forDono(form.dono_id)
      .withRaca(form.raca)
      .withObservacoes(form.observacoes)
      .withServicoPadrao(form.servicoPadrao)
      .isRemarcacaoAtiva(form.remarcAtiva ? 1 : 0)
      .withPacote(form.pacoteRemarcacao)
      .withInicioPacote(form.dataInicioPacote)
      .build();

    try {
      if (petToEdit?.id) {
        await petController.updatePet(petToEdit.id, petSalvar);
      } else {
        await petController.createPet(petSalvar);
      }
    } catch (erro) {
      showError(erro instanceof Error ? erro.message : "Erro inesperado.");
    }
  };

  const handleError = (e: unknown) =>
    showError(e instanceof Error ? e.message : "Erro inesperado.");

  const atualizarValores = (campo: keyof typeof form, valor: any) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const limparDono = () => {
    atualizarValores("dono_id", 0);
    atualizarValores("dono_nome", "");
  };

  const [modalDonoVisivel, setModalDonoVisivel] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchTxt, setSearchTxt] = useState("");
  const [owners, setOwners] = useState<Owner[] | undefined | null>();
  const [especiesList, setEspeciesList] = useState<
    { id: number; nome: string }[]
  >([]);
  const [racasList, setRacasList] = useState<{ id: number; nome: string }[]>(
    [],
  );

  useEffect(() => {
    try {
      ownerController
        .searchOwnersByNamePaged(searchTxt, page, LIMIT_ITEM_PAGE, ORDER.DESC)
        .then(setOwners)
        .catch(handleError);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Erro inesperado.");
    }
  }, [searchTxt, page]);

  useEffect(() => {
    speciesController.searchSpecies().then(setEspeciesList).catch(handleError);
  }, []);

  useEffect(() => {
    if (form.especie) {
      speciesController
        .searchBreedsBySpecies(form.especie)
        .then(setRacasList)
        .catch(handleError);
    }
  }, [form.especie]);

  return (
    <>
      <DefaultHeader />
      <TitleBar
        returnTo={Screen.Cadastros}
        title={petToEdit ? "Editar Pet" : "Novo Pet"}
        subtitle="Preencha os dados do pet"
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.ctnCadastro}>
          <View style={styles.viewDataReq}>
            <Text style={styles.titleDataInfo}>DADOS OBRIGATÓRIOS</Text>
          </View>

          <View style={styles.inputs}>
            <InputInfo
              image={require("../../../assets/animais/iconNome.png")}
              item={form.nome}
              setItem={(v) => atualizarValores("nome", v)}
              placeHolder="Digite o nome..."
              titleName="Nome Completo"
              variasLinhas={false}
              hasBorderBottom={true}
              digitavel={true}
            />
            <SelectionField
              image={require("../../../assets/animais/iconDono.png")}
              titleName="dono"
              selectedReg={form.dono_nome}
              buttonText={form.dono_nome ? "Trocar dono" : "Selecionar dono"}
              hasBorderBottom={true}
              onPress={() => setModalDonoVisivel(true)}
              setModal={() => setModalDonoVisivel(true)}
              goEdit={true}
              onClear={form.dono_nome ? limparDono : undefined}
            />

            <InputSelect
              placeholder="Selecione a espécie..."
              itens={especiesList}
              itemSelected={especiesList.find((e) => e.id === form.especie)}
              labelExtractor={(item) => item.nome}
              onChange={(item) => atualizarValores("especie", item.id)}
              renderItem={(item) => (
                <Text style={{ padding: 15 }}>{item.nome}</Text>
              )}
            />

            <InputSelect
              placeholder="Selecione a raça..."
              itens={racasList}
              itemSelected={racasList.find((e) => e.id === form.raca)}
              labelExtractor={(item) => item.nome}
              onChange={(item) => atualizarValores("raca", item.id)}
              renderItem={(item) => (
                <Text style={{ padding: 15 }}>{item.nome}</Text>
              )}
            />
          </View>
          <View style={styles.ctnBtnSalvar}>
            <TouchableOpacity style={styles.btnSalvar} onPress={salvarPet}>
              <Text style={styles.txtSalvar}>
                {petToEdit ? "Salvar alterações" : "Salvar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <ModalSelectList
        isOpen={modalDonoVisivel}
        isOwner={true}
        items={owners}
        page={page}
        total={total}
        onClose={() => setModalDonoVisivel(false)}
        onSelect={(item) => {
          atualizarValores("dono_id", item.id);
          atualizarValores("dono_nome", item.nome);
          setModalDonoVisivel(false);
        }}
        setPage={setPage}
        setSearch={(txt) => {
          setPage(0);
          setSearchTxt(txt);
        }}
      />
    </>
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
