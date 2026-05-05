// view/components/ErrorModal.tsx
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  message: string | null;
  onClose: () => void;
}

export default function ModalConfDelete({
  message,
  onClose,
  onDelete,
}: {
  message: string;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal visible={!!message} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Deseja mesmo excluir?</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnTxt}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={onDelete}>
            <Text style={styles.btnTxt}>Confirmar</Text>
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
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emoji: { fontSize: 40 },
  title: { fontSize: 16, fontWeight: "600", color: "#111" },
  message: { fontSize: 14, color: "#888", textAlign: "center" },
  btn: {
    marginTop: 8,
    backgroundColor: "#1D9E75",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  btnTxt: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
