import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../Themes/ThemeProvider";
import { touchTargetSlop } from "../Acessibilidade/accessibilityProps";
import { LINE_HEIGHTS, RADIUS, SPACING } from "../../Themes/tokens";

const PADDING_VERTICAL = SPACING[10];
const LINE_HEIGHT = LINE_HEIGHTS[20];

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
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.escolhaBtn,
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
          styles.escolhaText,
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

// As cores mudam com a aba escolhida e ficam no estilo inline; aqui, só o que não depende do tema.
const styles = StyleSheet.create({
  escolhaBtn: {
    paddingVertical: PADDING_VERTICAL,
    paddingHorizontal: SPACING[30],
    width: "40%",
    borderRadius: RADIUS[20],
  },
  escolhaText: {
    textAlign: "center",
    lineHeight: LINE_HEIGHT,
  },
});
