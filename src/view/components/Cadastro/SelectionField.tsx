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
import {
  FONT_SIZE,
  FONT_WEIGHT,
  LINE_HEIGHTS,
  RADIUS,
  SPACING,
} from "../../Themes/tokens";

/** Altura fixa da linha de "Cadastrar nova raça", para a área de toque chegar a 48 dp. */
const NEW_BREED_LINE_HEIGHT = LINE_HEIGHTS[20];

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
          <View
            style={[
              s.caixaReg,
              isEditavel ? { marginRight: SPACING[10] } : {},
            ]}
          >
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
      paddingHorizontal: SPACING[15],
      paddingVertical: SPACING[12],
      borderRadius: RADIUS[10],
      fontSize: FONT_SIZE.TITLE,
      minHeight: 45,
      borderColor: colors.BORDER_STRONG,
    },
    txtReg: {
      fontSize: FONT_SIZE.BODY_LARGE,
      color: colors.TEXT_PRIMARY,
    },
    containerAcoes: {
      width: "100%",
      // Espaçamento vertical automático entre o botão e o rótulo
      gap: SPACING[8],
    },
    btnSalvar: {
      width: "100%",
      height: 50,
      backgroundColor: colors.PRIMARY_VARIANT,
      borderRadius: RADIUS[15],
      display: "flex",
      justifyContent: "center",
    },
    txtSalvar: {
      color: colors.BACKGROUND,
      textAlign: "center",
      fontSize: FONT_SIZE.BODY_LARGE,
    },
    btnRotuloCadastro: {
      alignSelf: "flex-start", // Não deixa o botão ocupar a largura inteira
    },
    txtRotuloCadastro: {
      color: colors.TEXT_PRIMARY,
      fontSize: FONT_SIZE.BODY,
      lineHeight: NEW_BREED_LINE_HEIGHT,
      fontWeight: FONT_WEIGHT.MEDIUM,
    },
  });
