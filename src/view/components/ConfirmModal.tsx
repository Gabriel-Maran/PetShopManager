import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemeColors, useThemedStyles } from "../theme/ThemeProvider";
import { HIDDEN_FROM_SCREEN_READER } from "./accessibility/accessibilityProps";
import { FONT_SIZE, FONT_WEIGHT, LINE_HEIGHTS, RADIUS, SPACING } from "../theme/tokens";

type Variant = "destructive" | "default";

interface Props {
  visible: boolean;
  emoji?: string;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  emoji = "⚠️",
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
  onCancel,
}: Props) {
  const s = useThemedStyles(styles);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.overlay}>
        <View style={s.box}>
          <Text style={s.emoji} {...HIDDEN_FROM_SCREEN_READER}>
            {emoji}
          </Text>
          <Text style={s.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={s.message}>{message}</Text>
          <View style={s.row}>
            <TouchableOpacity
              style={[s.btn, s.btnCancel]}
              onPress={onCancel}
              accessibilityRole="button"
            >
              <Text style={s.btnCancelTxt}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, variant === "destructive" ? s.btnDestructive : s.btnPrimary]}
              onPress={onConfirm}
              accessibilityRole="button"
            >
              <Text style={s.btnConfirmTxt}>{confirmLabel}</Text>
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
    emoji: { fontSize: FONT_SIZE.DISPLAY },
    title: {
      fontSize: FONT_SIZE.SUBTITLE,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
      color: colors.TEXT_PRIMARY,
      textAlign: "center",
    },
    message: {
      fontSize: FONT_SIZE.BODY,
      color: colors.TEXT_MUTED,
      textAlign: "center",
      lineHeight: LINE_HEIGHTS[20],
    },
    row: {
      flexDirection: "row",
      gap: SPACING[10],
      marginTop: SPACING[12],
      width: "100%",
    },
    btn: {
      flex: 1,
      paddingVertical: SPACING[12],
      borderRadius: RADIUS[12],
      alignItems: "center",
    },
    btnCancel: {
      backgroundColor: colors.SURFACE_VARIANT,
      borderWidth: 1,
      borderColor: colors.BORDER_MID,
    },
    btnPrimary: { backgroundColor: colors.PRIMARY_VARIANT },
    btnDestructive: { backgroundColor: colors.RED_COLOR },
    btnCancelTxt: {
      fontSize: FONT_SIZE.BODY,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
      color: colors.TEXT_PRIMARY,
    },
    btnConfirmTxt: {
      fontSize: FONT_SIZE.BODY,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
      color: colors.BACKGROUND,
    },
  });
