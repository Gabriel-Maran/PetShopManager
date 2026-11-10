import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ImageSourcePropType,
} from "react-native";
import { Screen } from "../../../config/consts";
import ButtonEditar from "./Botões/ButtonEditar";
import { ThemeColors, useThemedStyles } from "../../Themes/ThemeProvider";
import InputWrapper from "../../components/Cadastro/InputWrapper";
import { A11Y_LABELS } from "../../../globals/accessibilityLabels";
import { touchTargetSlop } from "../Acessibilidade/accessibilityProps";

/** Altura fixa da linha de "Cadastrar nova raça", para a área de toque chegar a 48 dp. */
const NEW_BREED_LINE_HEIGHT = 20;

export default function SelectionField({
  isEditavel = true,
  image,
  titleName,
  selectedReg,
  buttonText,
  hasBorderBottom,
  onPress,
  goEdit,
  fazCadastro = false,
  onCadastro,
}: {
  isEditavel: boolean;
  image: ImageSourcePropType;
  titleName: string;
  selectedReg?: string;
  buttonText: string;
  hasBorderBottom: boolean;
  onPress: () => void;
  onClear?: () => void;
  goEdit: boolean;
  fazCadastro?: boolean;
  onCadastro?: () => void;
}) {
  const s = useThemedStyles(styles);

  return (
    <InputWrapper
      image={image}
      titleName={titleName}
      hasBorderBottom={hasBorderBottom}
    >
      {selectedReg ? (
        <View style={s.regSelecionado}>
          <View style={[s.caixaReg, isEditavel ? { marginRight: 10 } : {}]}>
            <Text style={s.txtReg} numberOfLines={1}>
              {selectedReg}
            </Text>
          </View>
          {isEditavel && (
            <ButtonEditar
              label={A11Y_LABELS.changeSelection(titleName)}
              navegarPara={Screen.Cadastros}
              goEdit={goEdit}
              setModal={onPress}
              editCampo={true}
            />
          )}
        </View>
      ) : (
        isEditavel && (
          <View style={s.containerAcoes}>
            <TouchableOpacity
              style={s.btnSalvar}
              onPress={onPress}
              accessibilityRole="button"
            >
              <Text style={s.txtSalvar}>{buttonText}</Text>
            </TouchableOpacity>
          </View>
        )
      )}
      {fazCadastro && onCadastro && (
        <TouchableOpacity
          style={s.btnRotuloCadastro}
          onPress={onCadastro}
          accessibilityRole="button"
          accessibilityLabel={A11Y_LABELS.registry.newBreed}
          hitSlop={touchTargetSlop({ height: NEW_BREED_LINE_HEIGHT })}
        >
          <Text style={s.txtRotuloCadastro}>+ Cadastrar nova raça</Text>
        </TouchableOpacity>
      )}
    </InputWrapper>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    regSelecionado: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    caixaReg: {
      borderWidth: 1.5,
      flex: 1,
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 10,
      fontSize: 20,
      minHeight: 45,
      borderColor: colors.BORDER_STRONG,
    },
    txtReg: {
      fontSize: 15,
      color: colors.TEXT_PRIMARY,
    },
    containerAcoes: {
      width: "100%",
      gap: 8, // Cria um espaçamento vertical automático entre o botão e o rótulo
    },
    btnSalvar: {
      width: "100%",
      height: 50,
      backgroundColor: colors.PRIMARY_VARIANT,
      borderRadius: 15,
      display: "flex",
      justifyContent: "center",
    },
    txtSalvar: {
      color: colors.BACKGROUND,
      textAlign: "center",
      fontSize: 15,
    },
    btnRotuloCadastro: {
      alignSelf: "flex-start", // Não deixa o botão ocupar a largura inteira
    },
    txtRotuloCadastro: {
      color: colors.TEXT_PRIMARY,
      fontSize: 14,
      lineHeight: NEW_BREED_LINE_HEIGHT,
      fontWeight: "500",
    },
  });
