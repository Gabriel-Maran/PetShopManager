import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemeColors, useThemedStyles } from "../Themes/ThemeProvider";

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
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.box}>
          <Text style={s.emoji}>{emoji}</Text>
          <Text style={s.title}>{title}</Text>
          <Text style={s.message}>{message}</Text>
          <View style={s.row}>
            <TouchableOpacity style={[s.btn, s.btnCancel]} onPress={onCancel}>
              <Text style={s.btnCancelTxt}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                s.btn,
                variant === "destructive" ? s.btnDestructive : s.btnPrimary,
              ]}
              onPress={onConfirm}
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
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
    },
    box: {
      width: "100%",
      backgroundColor: colors.BACKGROUND,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      gap: 8,
    },
    emoji: { fontSize: 40 },
    title: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.TEXT_PRIMARY,
      textAlign: "center",
    },
    message: {
      fontSize: 14,
      color: colors.TEXT_MUTED,
      textAlign: "center",
      lineHeight: 20,
    },
    row: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12,
      width: "100%",
    },
    btn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
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
      fontSize: 14,
      fontWeight: "600",
      color: colors.TEXT_PRIMARY,
    },
    btnConfirmTxt: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.BACKGROUND,
    },
  });
