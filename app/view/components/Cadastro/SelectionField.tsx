import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ImageSourcePropType,
} from "react-native";
import { Screen } from "../../../config/consts";
import ButtonEditar from "./Botões/ButtonEditar";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";
import InputWrapper from "../../components/Cadastro/InputWrapper";

export default function SelectionField({
  image,
  titleName,
  selectedReg,
  buttonText,
  hasBorderBottom,
  onPress,
  goEdit,
  setModal,
}: {
  image: ImageSourcePropType;
  titleName: string;
  selectedReg?: string;
  buttonText: string;
  hasBorderBottom: boolean;
  onPress: () => void;
  onClear?: () => void;
  goEdit: boolean;
  setModal: () => void;
}) {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  return (
    <InputWrapper
      image={image}
      titleName={titleName}
      hasBorderBottom={hasBorderBottom}
    >
      {selectedReg ? (
        <View style={s.regSelecionado}>
          <View style={s.caixaReg}>
            <Text style={s.txtReg} numberOfLines={1}>
              {selectedReg}
            </Text>
          </View>

          <ButtonEditar
            navegarPara={Screen.Cadastros}
            goEdit={goEdit}
            setModal={setModal}
            editCampo={true}
          />
        </View>
      ) : (
        <TouchableOpacity style={s.btnSalvar} onPress={onPress}>
          <Text style={s.txtSalvar}>{buttonText}</Text>
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
      borderWidth: 1.3,
      width: "80%",
      padding: 10,
      paddingLeft: 15,
      borderRadius: 10,
      fontSize: 20,
      borderColor: colors.BORDER_LIGHT,
    },
    txtReg: {
      fontSize: 15,
      color: colors.TEXT_PRIMARY,
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
  });
