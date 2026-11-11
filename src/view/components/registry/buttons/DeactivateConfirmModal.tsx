import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../../theme/ThemeProvider";
import { HIDDEN_FROM_SCREEN_READER } from "../../accessibility/accessibilityProps";
import {
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SPACING,
} from "../../../theme/tokens";

interface Props {
  message: string | null;
  onClose: () => void;
  onConfirm: () => void;
  visible: boolean;
}

export default function DeactivateConfirmModal({
  message,
  onClose,
  onConfirm,
  visible,
}: Props) {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.box}>
          <Text style={s.emoji} {...HIDDEN_FROM_SCREEN_READER}>
            ⚠️
          </Text>

          <View style={s.messageTop}>
            <Text style={s.title} accessibilityRole="header">
              Deseja mesmo desativar?
            </Text>
            <Text style={s.message}>{message}</Text>
          </View>

          <View style={s.btns}>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.TEXT_SECONDARY }]}
              onPress={onClose}
              accessibilityRole="button"
            >
              <Text style={s.btnTxt}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.DEACTIVATE_MAIN_COLOR }]}
              onPress={onConfirm}
              accessibilityRole="button"
            >
              <Text style={s.btnTxt}>Desativar</Text>
            </TouchableOpacity>
          </View>
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
      padding: SPACING[16],
    },
    box: {
      width: "100%",
      backgroundColor: colors.BACKGROUND,
      borderRadius: RADIUS[16],
      padding: SPACING[24],
      alignItems: "center",
      gap: SPACING[25],
    },
    emoji: {
      fontSize: FONT_SIZE.DISPLAY,
    },
    messageTop: {
      gap: SPACING[5],
      color: colors.TEXT_PRIMARY,
    },
    title: {
      fontSize: FONT_SIZE.SUBTITLE,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
      color: colors.TEXT_PRIMARY,
    },
    message: {
      fontSize: FONT_SIZE.BODY,
      color: colors.DEACTIVATE_MAIN_COLOR,
      fontWeight: FONT_WEIGHT.MEDIUM,
      textAlign: "center",
    },
    btns: {
      flexDirection: "row",
    },
    btn: {
      marginTop: SPACING[8],
      paddingVertical: SPACING[12],
      marginHorizontal: SPACING[10],
      borderRadius: RADIUS[12],
      flex: 1,
      alignItems: "center",
    },
    btnTxt: {
      color: colors.BACKGROUND,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
      fontSize: FONT_SIZE.BODY,
    },
  });
