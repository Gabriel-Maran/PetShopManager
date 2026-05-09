import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from "react-native";
import { useState } from "react";
import { Screen } from "../../../config/consts";
import ButtonEditar from "./Botões/ButtonEditar";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";

export default function SelectionField({
  image,
  titleName,
  selectedReg,
  buttonText,
  hasBorderBottom,
  onPress,
  onClear,
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
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  return (
    <View
      style={[
        s.ctnInput,
        hasBorderBottom
          ? { borderBottomWidth: 1, borderColor: colors.BORDER_LIGHT }
          : { borderWidth: 0 },
      ]}
    >
      <View style={s.ctnImgInput}>
        <Image style={s.imgInput} source={image} />
      </View>

      <View style={{ width: "90%", gap: 5 }}>
        <Text style={s.txtInput}>{titleName.toUpperCase()}</Text>

        {selectedReg ? (
          <View style={s.regSelecionado}>
            <View style={s.caixaReg}>
              <Text style={s.txtReg}>{selectedReg}</Text>
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
      </View>
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    ctnInput: {
      width: "100%",
      padding: 15,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    ctnImgInput: {
      backgroundColor: colors.PRIMARY_SOFT,
      padding: 8,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.PRIMARY_VARIANT,
    },
    imgInput: {
      width: 28,
      height: 28,
      tintColor: colors.PRIMARY,
    },
    txtInput: {
      color: colors.TEXT_MUTED,
      fontWeight: "bold",
      fontSize: 12,
    },
    regSelecionado: {
      width: "90%",
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
    },
    txtReg: {
      fontSize: 15,
    },
    btnSalvar: {
      width: "90%",
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
