// view/components/ErrorModal.tsx
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemeColors, useThemedStyles } from "../../Themes/ThemeProvider";
import { HIDDEN_FROM_SCREEN_READER } from "../Acessibilidade/accessibilityProps";

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
    emoji: {
      fontSize: 40,
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.TEXT_PRIMARY,
    },
    message: {
      fontSize: 14,
      color: colors.TEXT_MUTED,
      textAlign: "center",
    },
    btn: {
      marginTop: 8,
      backgroundColor: colors.PRIMARY_VARIANT,
      paddingVertical: 12,
      paddingHorizontal: 40,
      borderRadius: 12,
    },
    btnTxt: { color: colors.BACKGROUND, fontWeight: "600", fontSize: 14 },
  });
