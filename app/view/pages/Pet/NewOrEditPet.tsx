import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageSourcePropType,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

import {
  PacoteRemarcacao,
  PorteAnimal,
  Screen,
  TipoServico,
  PorteAnimalLabel,
  NewOrEditCadastros,
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
import ModalSelectList from "../../components/Cadastro/Modal/ModalSelectList";

import {
  pegarDonosBanco,
  pegarRacasBanco,
} from "../../../hooks/buscaBanco/usePet";

import useFormState from "../../../hooks/useFormState";
import ItemSelect from "../../components/Cadastro/ItemSelect";
import AbaInfoPet from "../../components/Cadastro/Tabs/AbaInfoPet";
import AbaAgendamentoPet from "../../components/Cadastro/Tabs/AbaAgendamentoPet";

//Transforma em um array com um id e o nome
const portesList = Object.keys(PorteAnimalLabel).map((key) => ({
  id: key,
  nome: PorteAnimalLabel[key as keyof typeof PorteAnimalLabel],
}));

export default function NewOrEditPet() {
  const [isCadastroPetSelecte, setIsCadastroPetSelecte] = useState(true);
  const { params, navigate } = useScreen<NewOrEditCadastros>();
  const [isNewPet, setIsNewPet] = useState(params?.pet?.nome ? false : true);
  const { showError } = useError();
  const isViewing = params?.mode === "view";
  const isEditing = params?.mode === "edit";

  const s = useThemedStyles(styles);
  const { colors } = useTheme();

  const { form, updateField } = useFormState({
    nome: params?.pet?.nome ?? "",
    especie: params?.pet?.especie ?? 0,
    dono_id: params?.pet?.dono_id ?? 0,
    dono_nome: "",
    raca: params?.pet?.raca ?? 0,
    raca_nome: params?.pet?.raca_nome ?? "",
    observacoes: params?.pet?.observacoes ?? "",
    servicoPadrao: params?.pet?.servico_padrao ?? TipoServico.Banho,
    remarcAtiva: Boolean(params?.pet?.remarcacao_ativa ?? false),
    porte:
      params?.pet?.porte && params.pet?.porte in PorteAnimal
        ? (params.pet?.porte as PorteAnimal)
        : PorteAnimal.MEDIO,
    pacoteRemarcacao:
      params?.pet?.pacote_remarcacao &&
      params.pet?.pacote_remarcacao in PacoteRemarcacao
        ? (params.pet?.pacote_remarcacao as PacoteRemarcacao)
        : undefined,
    dataInicioPacote: params?.pet?.data_inicio_pacote ?? undefined,
  });

  const { racasList, especiesList } = pegarRacasBanco(form.especie);
  const { owners, page, setPage, setSearchTxt, total } = pegarDonosBanco();

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
      .withPacote(form.pacoteRemarcacao ? form.pacoteRemarcacao : undefined)
      .withInicioPacote(
        form.dataInicioPacote ? form.dataInicioPacote : undefined,
      )
      .build();
    try {
      if (params?.pet?.id) {
        await petController.updatePet(params.pet.id, petSalvar);
      } else {
        await petController.createPet(petSalvar);
      }
      navigate(Screen.Cadastros, {
        type: "PET",
        mode: "view",
      } as NewOrEditCadastros);
    } catch (erro) {
      showError(erro instanceof Error ? erro.message : "Erro inesperado.");
    }
  };

  const [modalConfig, setModalConfig] = useState({
    visivel: false,
    titulo: "",
    itemIcon: undefined as ImageSourcePropType | undefined,
    lista: [] as any[],
    aoSelecionar: (item: any) => {},
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
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <DefaultHeader />
      <View style={{ backgroundColor: colors.THIRD_BACKGROUND }}>
        <TitleBar
          returnTo={Screen.Cadastros}
          params={
            {
              type: "PET",
              mode: "view",
            } as NewOrEditCadastros
          }
          title={
            isEditing
              ? "Editar Pet"
              : isViewing
                ? "Visualizando Pet"
                : "Novo Pet"
          }
          subtitle="Preencha os dados do pet"
          isViewing={isViewing}
          confirmReturn={!isViewing}
        />
        <View style={s.escolhaItem}>
          <ItemSelect
            title="Pet"
            isThisSelected={isCadastroPetSelecte}
            setValorSelect={() => setIsCadastroPetSelecte(true)}
            valorSelect={true}
          />
          <ItemSelect
            title="Agendamento"
            isThisSelected={!isCadastroPetSelecte}
            setValorSelect={() => setIsCadastroPetSelecte(false)}
            valorSelect={false}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.ctnCadastro}>
          {isCadastroPetSelecte ? (
            <AbaInfoPet
              isEditavel={!isViewing}
              form={form}
              isNewPet={isNewPet}
              updateField={updateField as (field: string, value: any) => void}
              portesList={portesList}
              rList={racasList}
              especiesList={especiesList}
              abrirModal={(config) =>
                abrirModal({
                  ...config,
                  lista:
                    config.titulo === "Selecionar Dono"
                      ? (owners ?? [])
                      : config.lista,
                })
              }
              salvarPet={salvarPet}
              petToEdit={params?.pet}
            />
          ) : (
            <AbaAgendamentoPet
              isEditavel={!isViewing}
              form={form}
              updateField={updateField as (field: string, value: any) => void}
            />
          )}
        </View>
        {!isViewing && (
          <View style={s.ctnBtnSalvar}>
            <TouchableOpacity style={s.btnSalvar} onPress={salvarPet}>
              <Text style={s.txtSalvar}>
                {isEditing ? "Salvar alterações" : "Salvar"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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

    escolhaItem: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      width: "100%",
      marginTop: 15,
      marginBottom: 10,
    },
    ctnBtnSalvar: {
      margin: "auto",
      marginBottom: 25,
    },
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
