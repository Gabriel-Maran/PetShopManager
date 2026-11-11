import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { touchTargetSlop } from "../accessibility/accessibilityProps";
import { LINE_HEIGHTS, RADIUS, SPACING } from "../../theme/tokens";

const PADDING_VERTICAL = SPACING[10];
const LINE_HEIGHT = LINE_HEIGHTS[20];

/** Uma aba de escolha, como Donos ou Pets. Quem usa põe as abas num contêiner com papel "tablist". */
export default function ItemSelect({
  isThisSelected,
  selectValue,
  setSelectValue,
  title,
}: {
  isThisSelected: boolean;
  selectValue: boolean;
  setSelectValue: (date: boolean) => void;
  title: string;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.choiceBtn,
        {
          backgroundColor: isThisSelected ? colors.PRIMARY : colors.SURFACE,
        },
      ]}
      onPress={() => setSelectValue(selectValue)}
      accessibilityRole="tab"
      accessibilityState={{ selected: isThisSelected }}
      hitSlop={touchTargetSlop({
        height: LINE_HEIGHT + 2 * PADDING_VERTICAL,
      })}
    >
      <Text
        style={[
          styles.choiceText,
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
  choiceBtn: {
    paddingVertical: PADDING_VERTICAL,
    paddingHorizontal: SPACING[30],
    width: "40%",
    borderRadius: RADIUS[20],
  },
  choiceText: {
    textAlign: "center",
    lineHeight: LINE_HEIGHT,
  },
});
