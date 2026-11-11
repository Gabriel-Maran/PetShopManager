import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemeColors, useThemedStyles } from "../../theme/ThemeProvider";
import { HIDDEN_FROM_SCREEN_READER } from "../accessibility/accessibilityProps";
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from "../../theme/tokens";

interface Props {
  message: string | null;
  onClose: () => void;
}

export default function ErrorModal({ message, onClose }: Props) {
  const s = useThemedStyles(styles);

  return (
    <Modal
      visible={!!message}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.box}>
          <Text style={s.emoji} {...HIDDEN_FROM_SCREEN_READER}>
            ⚠️
          </Text>
          <Text style={s.title} accessibilityRole="header">
            Algo deu errado
          </Text>
          <Text style={s.message}>{message}</Text>
          <TouchableOpacity
            style={s.btn}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={s.btnTxt}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.MODAL_BACKGROUND,
      justifyContent: "center",
      alignItems: "center",
      padding: SPACING[32],
    },
    box: {
      width: "100%",
      backgroundColor: colors.BACKGROUND,
      borderRadius: RADIUS[16],
      padding: SPACING[24],
      alignItems: "center",
      gap: SPACING[8],
    },
    emoji: {
      fontSize: FONT_SIZE.DISPLAY,
    },
    title: {
      fontSize: FONT_SIZE.SUBTITLE,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
      color: colors.TEXT_PRIMARY,
    },
    message: {
      fontSize: FONT_SIZE.BODY,
      color: colors.TEXT_MUTED,
      textAlign: "center",
    },
    btn: {
      marginTop: SPACING[8],
      backgroundColor: colors.PRIMARY_VARIANT,
      paddingVertical: SPACING[12],
      paddingHorizontal: SPACING[40],
      borderRadius: RADIUS[12],
    },
    btnTxt: {
      color: colors.BACKGROUND,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
      fontSize: FONT_SIZE.BODY,
    },
  });
