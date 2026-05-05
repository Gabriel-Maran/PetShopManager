import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  message: string | null;
  onClose: () => void;
  onConfirmDelete: () => void;
  visible: boolean;
}

export default function ModalConfDelete({
  message,
  onClose,
  onConfirmDelete,
  visible,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.emoji}>⚠️</Text>

          <View style={styles.messageTop}>
            <Text style={styles.title}>Deseja mesmo excluir?</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          <View style={styles.btns}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#808080" }]}
              onPress={onClose}
            >
              <Text style={styles.btnTxt}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#FF3B30" }]}
              onPress={onConfirmDelete}
            >
              <Text style={styles.btnTxt}>Excluir</Text>
            </TouchableOpacity>
          </View>
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
    padding: 16,
  },
  box: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 25,
  },
  emoji: {
    fontSize: 40,
  },
  messageTop: {
    gap: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  message: {
    fontSize: 14,
    color: "rgb(203, 31, 31)",
    fontWeight: "500",
    textAlign: "center",
  },
  btns: {
    flexDirection: "row",
  },
  btn: {
    marginTop: 8,
    paddingVertical: 12,
    marginHorizontal: 10,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
  },
  btnTxt: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
