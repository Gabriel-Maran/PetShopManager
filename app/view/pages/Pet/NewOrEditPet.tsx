import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import {
  EspeciesAtendidas,
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
import { ThemeColors, useThemedStyles } from "../../Themes/ThemeProvider";

export default function NewOrEditPet({ petToEdit }: { petToEdit?: Pet }) {
  const { showError } = useError();

  const s = useThemedStyles(styles);

  const [form, setForm] = useState({
    nome: petToEdit?.nome ?? "",
    especie: petToEdit?.especie ?? EspeciesAtendidas.CAO,
    dono_id: petToEdit?.dono_id ?? 0,
    dono_nome: "",
    raca: petToEdit?.raca ?? "",
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

  return (
    <>
      <DefaultHeader />
      <TitleBar
        returnTo={Screen.Cadastros}
        title={petToEdit ? "Editar Pet" : "Novo Pet"}
        subtitle="Preencha os dados do pet"
      />
      <ScrollView
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.ctnCadastro}>
          <View style={s.viewDataReq}>
            <Text style={s.titleDataInfo}>DADOS OBRIGATÓRIOS</Text>
          </View>

          <View style={s.inputs}>
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

            {/*     <InputInfo
              image={require("../../../assets/animais/iconPata.png")}
              item={form.especie}
              setItem={(v) => atualizarValores("especie", v)}
              placeHolder="Digite a espécie..."
              titleName="Espécie"
              variasLinhas={false}
              hasBorderBottom={true}
              digitavel={true}
            />

            <InputInfo
              image={require("../../../assets/animais/iconRaca.png")}
              item={form.raca}
              setItem={(v) => atualizarValores("raca", v)}
              placeHolder="Digite a raça..."
              titleName="Raça"
              variasLinhas={false}
              hasBorderBottom={true}
              digitavel={true}
            />
             */}
          </View>
          <View style={s.ctnBtnSalvar}>
            <TouchableOpacity style={s.btnSalvar} onPress={salvarPet}>
              <Text style={s.txtSalvar}>
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
    ctnBtnSalvar: { marginTop: 25 },
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
