import { StyleSheet, Text, TouchableOpacity } from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";
import { touchTargetSlop } from "../Acessibilidade/accessibilityProps";

const PADDING_VERTICAL = 10;
const LINE_HEIGHT = 20;

/** Uma aba de escolha, como Donos ou Pets. Quem usa põe as abas num contêiner com papel "tablist". */
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
      accessibilityRole="tab"
      accessibilityState={{ selected: isThisSelected }}
      hitSlop={touchTargetSlop({
        height: LINE_HEIGHT + 2 * PADDING_VERTICAL,
      })}
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
      paddingVertical: PADDING_VERTICAL,
      paddingHorizontal: 30,
      width: "40%",
      borderRadius: 20,
    },
    escolhaText: {
      textAlign: "center",
      lineHeight: LINE_HEIGHT,
    },
  });
