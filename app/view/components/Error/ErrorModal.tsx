// view/components/ErrorModal.tsx
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../../config/consts";

interface Props {
  message: string | null;
  onClose: () => void;
}

export default function ErrorModal({ message, onClose }: Props) {
  return (
    <Modal visible={!!message} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Algo deu errado</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnTxt}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  box: {
    width: "100%",
    backgroundColor: COLORS.BACKGROUND,
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
    color: COLORS.TEXT_PRIMARY,
  },
  message: {
    fontSize: 14,
    color: COLORS.BORDER_STRONG,
    textAlign: "center",
  },
  btn: {
    marginTop: 8,
    backgroundColor: COLORS.PRIMARY_VARIANT,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  btnTxt: { color: COLORS.BACKGROUND, fontWeight: "600", fontSize: 14 },
});
