import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemeColors, useThemedStyles } from "../../../Themes/ThemeProvider";

export default function ButtonAtivar({
  onActive,
  itemId,
}: {
  onActive: (itemId: number) => void;
  itemId: number;
}) {
  const s = useThemedStyles(styles);
  return (
    <View style={s.ctnReativar}>
      <TouchableOpacity onPress={() => onActive(itemId)} style={s.btnReativar}>
        <Image
          style={s.iconDelete}
          source={require("../../../../assets/crud/activate.png")}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    ctnReativar: {
      alignSelf: "center",
      justifyContent: "flex-end",
    },
    btnReativar: {
      marginLeft: 10,
      backgroundColor: colors.REATIVAR_BACKGROUND_COLOR,
      padding: 8,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.REATIVAR_BORDER_COLOR,
    },
    iconDelete: {
      tintColor: colors.REATIVAR_MAIN_COLOR,
      height: 28,
      width: 28,
    },
  });
