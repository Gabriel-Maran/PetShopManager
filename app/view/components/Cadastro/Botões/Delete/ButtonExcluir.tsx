import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useScreen } from "../../../../../hooks/useScreen";
import { ThemeColors, useThemedStyles } from "../../../../Themes/ThemeProvider";

export default function ButtonExcluir({
  onDelete,
  itemId,
}: {
  onDelete: (itemId: number) => void;
  itemId: number;
}) {
  const s = useThemedStyles(styles);
  return (
    <View style={s.ctnDelete}>
      <TouchableOpacity onPress={() => onDelete(itemId)} style={s.btnDelete}>
        <Image
          style={s.iconDelete}
          source={require("../../../../../assets/crud/delete.png")}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    ctnDelete: {
      alignSelf: "center",
      justifyContent: "flex-end",
    },
    btnDelete: {
      marginLeft: 10,
      backgroundColor: colors.EXCLUIR_BACKGROUND_COLOR,
      padding: 8,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.EXCLUIR_BORDER_COLOR,
    },
    iconDelete: {
      height: 28,
      width: 28,
    },
  });
