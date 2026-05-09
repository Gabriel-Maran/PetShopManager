import { StyleSheet, Text, TouchableOpacity } from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";

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
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        s.escolhaBtn,
        {
          backgroundColor: isThisSelected ? colors.PRIMARY : colors.SURFACE,
        },
      ]}
      onPress={() => setValorSelect(valorSelect)}
    >
      <Text
        style={[
          s.escolhaText,
          {
            color: isThisSelected ? colors.BACKGROUND : colors.TEXT_PRIMARY,
          },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
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
