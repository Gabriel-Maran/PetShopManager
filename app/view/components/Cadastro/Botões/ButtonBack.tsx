import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { Screen } from "../../../../config/consts";
import { useScreen } from "../../../../hooks/useScreen";
import { ThemeColors, useThemedStyles } from "../../../Themes/ThemeProvider";

export default function ButtonBack({
  backTo,
  params,
}: {
  backTo: Screen;
  params: any;
}) {
  const { screen, navigate } = useScreen();
  const s = useThemedStyles(styles);

  return (
    <TouchableOpacity
      onPress={() => navigate(backTo, params)}
      style={s.btnBack}
    >
      <Image
        style={s.imgBack}
        source={require("../../../../assets/setas/voltarBlack.png")}
      />
    </TouchableOpacity>
  );
}
const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    imgBack: {
      height: 40,
      width: 40,
      tintColor: colors.TEXT_PRIMARY,
    },
    btnBack: {
      borderColor: colors.BORDER_MID,
      borderWidth: 1,
      padding: 4,
      borderRadius: 15,
      justifyContent: "center",
    },
  });
