import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { COLORS } from "../../../config/consts";

export default function ItemSelect({
  isThisSelected,
  valorSelect,
  setValorSelect,
  title,
}: {
  isThisSelected: boolean;
  valorSelect: boolean;
  setValorSelect: (date: boolean) => void;
  title: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.escolhaBtn,
        {
          backgroundColor: isThisSelected ? COLORS.PRIMARY : COLORS.SURFACE,
        },
      ]}
      onPress={() => setValorSelect(valorSelect)}
    >
      <Text
        style={[
          styles.escolhaText,
          {
            color: isThisSelected ? COLORS.BACKGROUND : COLORS.TEXT_PRIMARY,
          },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  escolhaBtn: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    width: "40%",
    borderRadius: 20,
  },
  escolhaText: {
    textAlign: "center",
  },
});
