import { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageSourcePropType,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";

import {
  PacoteRemarcacao,
  PorteAnimal,
  Screen,
  TipoServico,
  PorteAnimalLabel,
  NewOrEditCadastros,
} from "../../../config/consts";

import { todayIso } from "../../../utils/datas";
import { formatMoneyInput, parseMoneyInput } from "../../../utils/dinheiro";

import { useError } from "../../../hooks/useError";
import { useScreen } from "../../../hooks/useScreen";
import {
  pegarDonosBanco,
  pegarRacasBanco,
} from "../../../hooks/buscaBanco/usePet";
import useFormState from "../../../hooks/useFormState";

import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";

import { PetBuilder } from "../../../model/Pet";
import { petController } from "../../../controller/PetController";

import TitleBar from "../../components/Cadastro/TitleBar";
import DefaultHeader from "../../components/Header/DefaultHeader";
import ModalSelectList from "../../components/Cadastro/Modal/ModalSelectList";
import ItemSelect from "../../components/Cadastro/ItemSelect";
import AbaInfoPet, {
  AbrirModalConfig,
} from "../../components/Cadastro/Tabs/AbaInfoPet";
import AbaAgendamentoPet from "../../components/Cadastro/Tabs/AbaAgendamentoPet";

const portesList = Object.keys(PorteAnimalLabel).map((key) => ({
  id: key,
  nome: PorteAnimalLabel[key as keyof typeof PorteAnimalLabel],
}));

const MODAL_INICIAL = {
  visivel: false,
  titulo: "",
  itemIcon: undefined as ImageSourcePropType | undefined,
  lista: [] as any[],
  tipoModal: "" as "DONO" | "RACA" | "",
  aoSelecionar: (_item: any) => {},
};

export default function NewOrEditPet() {
  const [isCadastroPetSelecte, setIsCadastroPetSelecte] = useState(true);
  const { params, navigate } = useScreen<NewOrEditCadastros>();
  const { showError } = useError();

  const [isSalvando, setIsSalvando] = useState(false);

  const isViewing = params?.mode === "view";
  const isEditing = params?.mode === "edit";
  const isNewPet = !params?.pet?.id;

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
    valorPacote: formatMoneyInput(params?.pet?.valor_pacote),
    porte:
      params?.pet?.porte && params.pet?.porte in PorteAnimal
        ? (params.pet?.porte as PorteAnimal)
        : PorteAnimal.MEDIO,
    pacoteRemarcacao:
      params?.pet?.pacote_remarcacao &&
      params.pet?.pacote_remarcacao in PacoteRemarcacao
        ? (params.pet?.pacote_remarcacao as PacoteRemarcacao)
        : undefined,
    dataInicioPacote: params?.pet?.data_inicio_pacote ?? todayIso(),
    horario_padrao: params?.pet?.horario_padrao ?? "",
  });

  // ─── Fonte única de dados: um único hook para raças e espécies ───────────────
  // racasList, page, setPage, setSearchTxt e total controlam o modal de raças
  const {
    racasList,
    especiesList,
    page: racaPage,
    setPage: setRacaPage,
    setSearchTxt: setRacaSearchTxt,
    total: racaTotal,
  } = pegarRacasBanco(form.especie);

  const {
    owners,
    page: donoPage,
    setPage: setDonoPage,
    setSearchTxt: setDonoSearchTxt,
    total: donoTotal,
  } = pegarDonosBanco();

  const [modalConfig, setModalConfig] = useState(MODAL_INICIAL);

  // --- Salvar pet ---
  const salvarPet = useCallback(async () => {
    if (isSalvando) return;
    setIsSalvando(true);

    try {
      // Dentro do try: um valor digitado fora do formato vira a mensagem de erro da tela.
      const petSalvar = new PetBuilder()
        .withNome(form.nome)
        .withEspecie(form.especie)
        .withPorte(form.porte)
        .forDono(form.dono_id)
        .withRaca(form.raca)
        .withObservacoes(form.observacoes)
        .withServicoPadrao(form.servicoPadrao)
        .isRemarcacaoAtiva(form.remarcAtiva ? 1 : 0)
        .withPacote(form.pacoteRemarcacao ?? undefined)
        .withInicioPacote(form.dataInicioPacote ?? todayIso())
        .withHorarioPadrao(form.horario_padrao || "00:00")
        .withValorPacote(parseMoneyInput(form.valorPacote))
        .build();

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
    } finally {
      setIsSalvando(false);
    }
  }, [isSalvando, form, params?.pet?.id, navigate, showError]);

  // --- Abre o modal (DONO ou RACA) ---
  const abrirModal = useCallback(
    ({
      titulo,
      lista,
      itemIcon,
      tipoModal,
      aoSelecionar,
    }: AbrirModalConfig) => {
      setModalConfig({
        visivel: true,
        titulo,
        itemIcon,
        tipoModal,
        lista: tipoModal === "DONO" ? (owners ?? []) : lista,
        aoSelecionar: (item) => {
          aoSelecionar(item);
          setModalConfig((prev) => ({ ...prev, visivel: false }));
        },
      });
    },
    [owners],
  );

  const fecharModal = useCallback(() => {
    setModalConfig((prev) => ({ ...prev, visivel: false }));
  }, []);

  // --- Sincroniza lista do modal de DONO quando owners mudam (paginação/busca) ---
  useEffect(() => {
    if (modalConfig.visivel && modalConfig.tipoModal === "DONO") {
      setModalConfig((prev) => ({ ...prev, lista: owners ?? [] }));
    }
  }, [owners]);

  // --- Sincroniza lista do modal de RACA quando racasList mudam (paginação/busca) ---
  useEffect(() => {
    if (modalConfig.visivel && modalConfig.tipoModal === "RACA") {
      setModalConfig((prev) => ({ ...prev, lista: racasList ?? [] }));
    }
  }, [racasList]);

  // --- Busca no modal: server-side para DONO, server-side para RACA também ---
  const handleSetSearch = useCallback(
    (txt: string) => {
      if (modalConfig.tipoModal === "DONO") {
        setDonoPage(0);
        setDonoSearchTxt(txt);
      } else if (modalConfig.tipoModal === "RACA") {
        setRacaPage(0);
        setRacaSearchTxt(txt); // dispara o hook → racasList atualiza → useEffect acima sincroniza o modal
      }
    },
    [
      modalConfig.tipoModal,
      setDonoPage,
      setDonoSearchTxt,
      setRacaPage,
      setRacaSearchTxt,
    ],
  );

  const isDono = modalConfig.tipoModal === "DONO";
  const isRaca = modalConfig.tipoModal === "RACA";

  const pageModal = isDono ? donoPage : isRaca ? racaPage : 0;
  const totalModal = isDono
    ? donoTotal
    : isRaca
      ? racaTotal
      : modalConfig.lista.length;
  const setPageModal = isDono ? setDonoPage : isRaca ? setRacaPage : () => {};

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <DefaultHeader />

      <View style={{ backgroundColor: colors.THIRD_BACKGROUND }}>
        <TitleBar
          returnTo={Screen.Cadastros}
          params={{ type: "PET", mode: "view" } as NewOrEditCadastros}
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
          <View style={{ display: isCadastroPetSelecte ? "flex" : "none" }}>
            <AbaInfoPet
              isEditavel={!isViewing}
              form={form}
              isNewPet={isNewPet}
              updateField={updateField as (field: string, value: any) => void}
              portesList={portesList}
              especiesList={especiesList}
              racasList={racasList ?? []}
              abrirModal={abrirModal}
              salvarPet={salvarPet}
              visible={isCadastroPetSelecte}
            />
          </View>

          <View style={{ display: !isCadastroPetSelecte ? "flex" : "none" }}>
            <AbaAgendamentoPet
              isEditavel={!isViewing}
              form={form}
              updateField={updateField as (field: string, value: any) => void}
              visible={!isCadastroPetSelecte}
            />
          </View>
          {!isViewing && (
            <View style={s.ctnBtnSalvar}>
              <TouchableOpacity
                style={[s.btnSalvar, isSalvando && s.btnSalvarDisabled]}
                onPress={salvarPet}
                disabled={isSalvando}
              >
                {isSalvando ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={s.txtSalvar}>
                    {isEditing ? "Salvar alterações" : "Salvar"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <ModalSelectList
        isOpen={modalConfig.visivel}
        items={modalConfig.lista}
        titulo={modalConfig.titulo}
        itemIcon={modalConfig.itemIcon}
        onSelect={modalConfig.aoSelecionar}
        onClose={fecharModal}
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
    ctnCadastro: {
      flex: 1,
      padding: 20,
      alignItems: "center",
    },
    escolhaItem: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: 10,
    },
    ctnBtnSalvar: {
      marginTop: 15,
    },
    btnSalvar: {
      paddingVertical: 20,
      paddingHorizontal: 75,
      backgroundColor: colors.PRIMARY_VARIANT,
      borderRadius: 15,
    },
    btnSalvarDisabled: {
      opacity: 0.6,
    },
    txtSalvar: {
      color: colors.BACKGROUND,
      textAlign: "center",
    },
  });
