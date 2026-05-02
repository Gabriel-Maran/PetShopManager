import { StyleSheet, Text, TouchableOpacity } from "react-native";

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
        { backgroundColor: isThisSelected ? "#0E9599" : "#F1F5F9" },
      ]}
      onPress={() => setValorSelect(valorSelect)}
    >
      <Text
        style={[
          styles.escolhaText,
          { color: isThisSelected ? "#ffffff" : "#000000" },
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
