import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ImageSourcePropType,
} from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../../Themes/ThemeProvider";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { speciesController } from "../../../../controller/SpeciesController";
import InputSelect from "../../InputSelect";
import { EspeciesAtendidasLabel } from "../../../../config/consts";
import InputInfo from "../InputInfo";
import CloseButton from "../../CloseButton";
import { MAX_BREED_NAME_LENGTH } from "../../../../globals/limits";
import {
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SPACING,
} from "../../../Themes/tokens";

const SUBMIT_LABEL = "Cadastrar";

interface Especie {
  id: number;
  nome: string;
}

interface ModalCadastroRacaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (id: number, nomeRaca: string, especieId: number) => void;
  especiesList: Especie[];
  especieIcone?: ImageSourcePropType;
}

export default function ModalCadastroRaca({
  isOpen,
  onClose,
  onSuccess,
  especiesList,
  especieIcone,
}: ModalCadastroRacaProps) {
  const s = useThemedStyles(styles);
  const [nomeRaca, setNomeRaca] = useState("");
  const [especieSelecionada, setEspecieSelecionada] = useState<Especie | null>(
    null,
  );

  function resetForm() {
    setNomeRaca("");
    setEspecieSelecionada(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  // A validação da espécie e do nome fica no controller e no service, com as mensagens de cada falha.
  const { run: handleSubmit, isRunning: loading } = useAsyncAction(async () => {
    const especieId = especieSelecionada?.id ?? 0;
    const id = await speciesController.createBreed({ especieId, nomeRaca });
    onSuccess(id, nomeRaca.trim(), especieId);
    handleClose();
  });

  const { colors } = useTheme();

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Os Pressable só fecham ao tocar fora; sem accessible, o leitor percorre o conteúdo item a item. */}
        <Pressable style={s.overlay} onPress={handleClose} accessible={false}>
          <Pressable style={s.card} onPress={() => {}} accessible={false}>
            {/* Cabeçalho */}
            <View style={s.header}>
              <Text style={s.title} accessibilityRole="header">
                Nova Raça
              </Text>
              <CloseButton onPress={handleClose} />
            </View>

            <View style={s.divider} />

            {/* Campos */}
            <View style={s.body}>
              <InputSelect
                titleName="Espécie"
                image={
                  especieIcone ??
                  require("../../../../assets/animais/iconEspecie.png")
                }
                placeholder="Selecione a espécie..."
                itens={especiesList}
                itemSelected={especieSelecionada ?? undefined}
                labelExtractor={(item) =>
                  EspeciesAtendidasLabel[
                    item.nome as keyof typeof EspeciesAtendidasLabel
                  ]
                }
                onChange={setEspecieSelecionada}
                renderItem={(item) => (
                  <>
                    <Text
                      style={{
                        padding: SPACING[15],
                        color: colors.TEXT_PRIMARY,
                      }}
                    >
                      {
                        EspeciesAtendidasLabel[
                          item.nome as keyof typeof EspeciesAtendidasLabel
                        ]
                      }
                    </Text>
                  </>
                )}
                hasBorderBottom={true}
                isEditavel={true}
              />

              <InputInfo
                image={require("../../../../assets/animais/iconRaca.png")}
                titleName="Nome da Raça"
                item={nomeRaca}
                setItem={setNomeRaca}
                placeHolder="Ex: Golden Retriever..."
                variasLinhas={false}
                digitavel={true}
                tipoTeclado="default"
                maximoCaracteres={MAX_BREED_NAME_LENGTH}
                hasBorderBottom={false}
              />
            </View>

            <View style={s.divider} />

            {/* Rodapé */}
            <View style={s.footer}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={handleClose}
                disabled={loading}
                accessibilityRole="button"
              >
                <Text style={s.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.submitBtn, loading && s.submitBtnLoading]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
                accessibilityRole="button"
                // Durante o envio o texto some; o rótulo fixo mantém o nome do botão.
                accessibilityLabel={SUBMIT_LABEL}
                accessibilityState={{ busy: loading }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.BACKGROUND} />
                ) : (
                  <Text style={s.submitText}>{SUBMIT_LABEL}</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.MODAL_BACKGROUND,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: SPACING[20],
    },
    card: {
      width: "100%",
      backgroundColor: colors.BACKGROUND,
      borderRadius: RADIUS[16],
      overflow: "hidden",
      elevation: 8,
      shadowColor: colors.SHADOW,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SPACING[16],
      paddingVertical: SPACING[14],
    },
    title: {
      fontSize: FONT_SIZE.BODY_LARGE,
      fontWeight: FONT_WEIGHT.BOLD,
      color: colors.TEXT_PRIMARY,
    },
    divider: {
      height: 1,
      backgroundColor: colors.BORDER_MID,
    },
    body: {
      paddingVertical: SPACING[8],
    },

    footer: {
      flexDirection: "row",
      paddingHorizontal: SPACING[16],
      paddingVertical: SPACING[14],
      gap: SPACING[10],
    },
    cancelBtn: {
      flex: 1,
      height: 46,
      borderRadius: RADIUS[10],
      borderWidth: 1.5,
      borderColor: colors.BORDER_MID,
      justifyContent: "center",
      alignItems: "center",
    },
    cancelText: {
      fontSize: FONT_SIZE.BODY,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
      color: colors.TEXT_MUTED,
    },
    submitBtn: {
      flex: 2,
      height: 46,
      borderRadius: RADIUS[10],
      backgroundColor: colors.PRIMARY,
      justifyContent: "center",
      alignItems: "center",
    },
    submitBtnLoading: {
      opacity: 0.7,
    },
    submitText: {
      fontSize: FONT_SIZE.BODY_LARGE,
      fontWeight: FONT_WEIGHT.BOLD,
      color: colors.BACKGROUND,
    },
  });
