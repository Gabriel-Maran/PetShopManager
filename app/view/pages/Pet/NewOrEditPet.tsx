import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageSourcePropType
} from "react-native";

import {
  PacoteRemarcacao,
  PorteAnimal,
  Screen,
  TipoServico,
  PorteAnimalLabel,
} from "../../../config/consts";
import { Pet, PetBuilder } from "../../../model/Pet";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";

import { useError } from "../../../hooks/useError";
import { useScreen } from "../../../hooks/useScreen";
import { petController } from "../../../controller/PetController";

import TitleBar from "../../components/Cadastro/TitleBar";
import DefaultHeader from "../../components/Header/DefaultHeader";
import InputInfo from "../../components/Cadastro/InputInfo";
import SelectionField from "../../components/Cadastro/SelectionField";
import ModalSelectList from "../../components/Cadastro/Modal/ModalSelectList";
import InputSelect from "../../components/InputSelect";

import { pegarDonosBanco, pegarRacasBanco } from "../../../utils/buscaBanco/pet";

import { EspeciesAtendidasLabel } from "../../../config/consts";
import useFormState from "../../../hooks/useFormState";

//Transforma em um array com um id e o nome
const portesList = Object.keys(PorteAnimalLabel).map((key) => ({
  id: key,
  nome: PorteAnimalLabel[key as keyof typeof PorteAnimalLabel],
}));

export default function NewOrEditPet({ petToEdit }: { petToEdit?: Pet }) {
  const { params, navigate } = useScreen<Pet>();
  const { showError } = useError();
  const s = useThemedStyles(styles);
  const { colors } = useTheme();

  const {
    form,
    updateField
  } = useFormState({
    nome: petToEdit?.nome ?? "",
    especie: petToEdit?.especie ?? 0,
    dono_id: petToEdit?.dono_id ?? 0,
    dono_nome: "",
    raca: petToEdit?.raca ?? 0,
    raca_nome: petToEdit?.raca_nome ?? "",
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
  }
  )

  const { racasList, especiesList } = pegarRacasBanco(form.especie)
  const {
    owners,
    page,
    setPage,
    setSearchTxt,
    total,
  } = pegarDonosBanco()

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
      navigate(Screen.Cadastros, "PETS");
    } catch (erro) {
      showError(erro instanceof Error ? erro.message : "Erro inesperado.");
    }
  };

  const [modalConfig, setModalConfig] = useState({
    visivel: false,
    titulo: "",
    itemIcon: undefined as ImageSourcePropType | undefined,
    lista: [] as any[],
    aoSelecionar: (item: any) => { },
  });

  const abrirModal = ({
    titulo,
    lista,
    itemIcon,
    aoSelecionar,
  }: {
    titulo: string;
    itemIcon?: ImageSourcePropType;
    lista: any[];
    aoSelecionar: (item: any) => void;
  }) => {
    setModalConfig({
      visivel: true,
      titulo: titulo,
      itemIcon: itemIcon,
      lista: lista,
      aoSelecionar: (item) => {
        aoSelecionar(item);
        setModalConfig((prev) => ({ ...prev, visivel: false }));
      },
    });
  };

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
              setItem={(v) => updateField("nome", v)}
              placeHolder="Digite o nome..."
              titleName="Nome Completo"
              variasLinhas={false}
              hasBorderBottom={true}
              digitavel={true}
            />

            <SelectionField
              image={require("../../../assets/animais/iconDono.png")}
              titleName="Dono"
              selectedReg={form.dono_nome}
              buttonText={form.dono_nome ? "Trocar dono" : "Selecionar dono"}
              hasBorderBottom={true}
              onPress={() =>
                abrirModal({
                  titulo: "Selecionar Dono",
                  itemIcon: require("../../../assets/animais/iconDono.png"),
                  lista: owners || [],
                  aoSelecionar: (item) => {
                    updateField("dono_id", item.id);
                    updateField("dono_nome", item.nome);
                  },
                })
              }
              onClear={() => {
                updateField("dono_id", 0);
                updateField("dono_nome", "");
              }}
              goEdit={true}
              setModal={() => { }}
            />
            <InputSelect
              titleName="Espécie"
              image={require("../../../assets/animais/iconPata.png")}
              placeholder="Selecione a espécie..."
              itens={especiesList}
              itemSelected={especiesList.find((e) => e.id === form.especie)}
              labelExtractor={(item) => EspeciesAtendidasLabel[item.nome]}
              onChange={(item) => updateField("especie", item.id)}
              renderItem={(item) => (
                <Text style={{ padding: 15, color: colors.TEXT_PRIMARY }}>
                  {EspeciesAtendidasLabel[item.nome]}
                </Text>
              )}
              hasBorderBottom={true}
            />
            <SelectionField
              image={require("../../../assets/animais/iconPata.png")}
              titleName="Raça"
              selectedReg={form.raca_nome}
              buttonText={form.raca_nome ? "Trocar raça" : "Selecionar raça"}
              hasBorderBottom={true}
              onPress={() =>
                abrirModal({
                  titulo: "Selecionar Raça",
                  itemIcon: require("../../../assets/animais/iconPata.png"),
                  lista: racasList || [],
                  aoSelecionar: (item) => {
                    updateField("raca", item.id);
                    updateField("raca_nome", item.nome);
                  },
                })
              }
              onClear={() => {
                updateField("raca", 0);
                updateField("raca_nome", "");
              }}
              goEdit={true}
              setModal={() => { }}
            />
            <InputSelect
              titleName="Porte"
              image={require("../../../assets/animais/iconPata.png")}
              placeholder="Selecione o Porte do animal"
              itens={portesList}
              itemSelected={portesList.find((e) => e.id === form.porte)}
              labelExtractor={(item) => item.nome}
              onChange={(item) => updateField("porte", item.nome as PorteAnimal)}
              renderItem={(item) => (
                <Text style={{ padding: 15, color: colors.TEXT_PRIMARY }}>
                  {item.nome}
                </Text>
              )}
              hasBorderBottom={true}
            />

            <InputInfo
              image={require("../../../assets/nav_bar/artigo.png")}
              item={form.observacoes}
              setItem={(v) => updateField("observacoes", v)}
              placeHolder="Uma observação adicional..."
              titleName="Observações"
              variasLinhas={true}
              digitavel={true}
              hasBorderBottom={true}
            />
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
        isOpen={modalConfig.visivel}
        items={modalConfig.lista}
        titulo={modalConfig.titulo}
        itemIcon={modalConfig.itemIcon}
        onSelect={modalConfig.aoSelecionar}
        onClose={() => setModalConfig((prev) => ({ ...prev, visivel: false }))}
        page={page}
        total={total}
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
