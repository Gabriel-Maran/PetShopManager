import { StyleSheet, View, Text, TouchableOpacity, Image, ImageSourcePropType } from "react-native";
import { useState } from "react";
import { COLORS, Screen } from "../../../config/consts";
import ButtonEditar from "./Botões/ButtonEditar";

export default function SelectionField({
  image,
  titleName,
  selectedReg,
  buttonText,
  hasBorderBottom,
  onPress,
  onClear,
}: {
  image: ImageSourcePropType;
  titleName: string;
  selectedReg?: string;
  buttonText: string;
  hasBorderBottom: boolean;
  onPress: () => void;
  onClear?: () => void;
}) {
  return (
    <View
      style={[
        styles.ctnInput,
        hasBorderBottom
          ? { borderBottomWidth: 1, borderColor: COLORS.BORDER_LIGHT }
          : { borderWidth: 0 },
      ]}
    >
      <View style={styles.ctnImgInput}>
        <Image style={styles.imgInput} source={image} />
      </View>

      <View style={{ width: "90%", gap: 5 }}>
        <Text style={styles.txtInput}>{titleName.toUpperCase()}</Text>

        {selectedReg ? (
          <View style={styles.petSelecionado}>
            <View style={styles.txtNomePet}>
              <Text>{selectedReg}</Text>
            </View>

            <ButtonEditar navegarPara={Screen.Cadastros} editCampo={true} />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.btnSalvar}
            onPress={onPress}
          >
            <Text style={styles.txtSalvar}>{buttonText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ctnInput: {
    width: "100%",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ctnImgInput: {
    backgroundColor: COLORS.PRIMARY_SOFT,
    padding: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_VARIANT,
  },
  imgInput: {
    width: 28,
    height: 28,
    tintColor: COLORS.PRIMARY,
  },
  txtInput: {
    color: COLORS.TEXT_MUTED,
    fontWeight: "bold",
    fontSize: 12,
  },
  petSelecionado: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  txtNomePet: {
    borderWidth: 1.3,
    width: "80%",
    padding: 10,
    borderRadius: 10,
  },
  btnSalvar: {
    width: "90%",
    height: 50,
    backgroundColor: COLORS.PRIMARY_VARIANT,
    borderRadius: 15,
    display: "flex",
    justifyContent: "center",
  },
  txtSalvar: {
    color: COLORS.BACKGROUND,
    textAlign: "center",
    fontSize: 15,
  },
});
