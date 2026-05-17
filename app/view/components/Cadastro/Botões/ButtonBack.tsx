import { Image, StyleSheet, TouchableOpacity } from "react-native";
import { Screen } from "../../../../config/consts";
import { useScreen } from "../../../../hooks/useScreen";
import { ThemeColors, useThemedStyles } from "../../../Themes/ThemeProvider";

// 1. Tornamos 'backTo' opcional e adicionamos 'onPress' opcional
interface ButtonBackProps {
  confirmReturn: boolean;
  backTo?: Screen;
  params?: any;
  onPress?: () => void;
}

export default function ButtonBack({
  confirmReturn = false,
  backTo,
  params,
  onPress,
}: ButtonBackProps) {
  const { navigate } = useScreen();
  const s = useThemedStyles(styles);

  // 2. Executa a função personalizada se existir; caso contrário, navega
  const handlePress = () => {
    if (confirmReturn && onPress) {
      onPress();
    } else if (backTo) {
      navigate(backTo, params);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={s.btnBack}>
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
