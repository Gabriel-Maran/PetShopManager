import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemeColors, useThemedStyles } from "../../../Themes/ThemeProvider";

export default function ButtonAtivar({
  onActivate,
  itemId,
}: {
  onActivate: (itemId: number) => void;
  itemId: number;
}) {
  const s = useThemedStyles(styles);
  return (
    <View style={s.container}>
      <TouchableOpacity onPress={() => onActivate(itemId)} style={s.button}>
        <Image
          style={s.icon}
          source={require("../../../../assets/crud/activate.png")}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignSelf: "center",
      justifyContent: "flex-end",
    },
    button: {
      marginLeft: 10,
      backgroundColor: colors.REATIVAR_BACKGROUND_COLOR,
      padding: 8,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.REATIVAR_BORDER_COLOR,
    },
    icon: {
      tintColor: colors.REATIVAR_MAIN_COLOR,
      height: 28,
      width: 28,
    },
  });
