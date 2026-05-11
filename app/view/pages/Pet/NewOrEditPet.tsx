import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  PacoteRemarcacao,
  PorteAnimal,
  Screen,
  TipoServico,
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

import { usePetFormSetup } from "../../../hooks/usePetFormSetup";

import { EspeciesAtendidasLabel } from "../../../config/consts";
import { EspeciesAtendidasLabel } from "../../../config/consts";

export default function NewOrEditPet({ petToEdit }: { petToEdit?: Pet }) {
  const { params, navigate } = useScreen<Pet>();
  const { showError } = useError();
  const s = useThemedStyles(styles);
  const { colors } = useTheme();

  const [form, setForm] = useState({
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
  });

  const {
    especiesList,
    racasList,
    owners,
    page,
    total,
    setPage,
    setSearchTxt,
  } = usePetFormSetup(form.especie);

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

  const atualizarValores = (campo: keyof typeof form, valor: any) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const [modalConfig, setModalConfig] = useState({
    visivel: false,
    titulo: "",
    lista: [] as any[],
    aoSelecionar: (item: any) => {},
  });

  const abrirModal = ({
    titulo,
    lista,
    aoSelecionar,
  }: {
    titulo: string;
    lista: any[];
    aoSelecionar: (item: any) => void;
  }) => {
    setModalConfig({
      visivel: true,
      titulo: titulo,
      lista: lista,
      aoSelecionar: (item) => {
        aoSelecionar(item);
        setModalConfig((prev) => ({ ...prev, visivel: false }));
      },
    });
  };

  const limparDono = () => {
    atualizarValores("dono_id", 0);
    atualizarValores("dono_nome", "");
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
              setItem={(v) => atualizarValores("nome", v)}
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
                  lista: owners || [],
                  aoSelecionar: (item) => {
                    atualizarValores("dono_id", item.id);
                    atualizarValores("dono_nome", item.nome);
                  },
                })
              }
              onClear={form.dono_nome ? limparDono : undefined}
              goEdit={true}
              setModal={() => {}}
            />
            <InputSelect
              titleName="Espécie"
              image={require("../../../assets/animais/iconPata.png")}
              placeholder="Selecione a espécie..."
              itens={especiesList}
              itemSelected={especiesList.find((e) => e.id === form.especie)}
              labelExtractor={(item) => EspeciesAtendidasLabel[item.nome]}
              onChange={(item) => atualizarValores("especie", item.id)}
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
                  lista: racasList || [],
                  aoSelecionar: (item) => {
                    atualizarValores("raca", item.id);
                    atualizarValores("raca_nome", item.nome); 
                  },
                })
              }
              onClear={() => {
                atualizarValores("raca", 0);
                atualizarValores("raca_nome", "");
              }}
              goEdit={true}
              setModal={() => {}}
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
