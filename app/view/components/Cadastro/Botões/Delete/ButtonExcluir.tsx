import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemeColors, useThemedStyles } from "../../../../Themes/ThemeProvider";

export default function ButtonExcluir({
  onDeactivate,
  itemId,
}: {
  onDeactivate: (itemId: number) => void;
  itemId: number;
}) {
  const s = useThemedStyles(styles);
  return (
    <View style={s.container}>
      <TouchableOpacity onPress={() => onDeactivate(itemId)} style={s.button}>
        <Image
          style={s.icon}
          source={require("../../../../../assets/crud/delete.png")}
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
      backgroundColor: colors.EXCLUIR_BACKGROUND_COLOR,
      padding: 8,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.EXCLUIR_BORDER_COLOR,
    },
    icon: {
      height: 28,
      width: 28,
    },
  });
