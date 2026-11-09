import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../../../Themes/ThemeProvider";

interface Props {
  message: string | null;
  onClose: () => void;
  onConfirm: () => void;
  visible: boolean;
}

export default function ModalConfDelete({
  message,
  onClose,
  onConfirm,
  visible,
}: Props) {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.box}>
          <Text style={s.emoji}>⚠️</Text>

          <View style={s.messageTop}>
            <Text style={s.title}>
              Deseja mesmo desativar?
            </Text>
            <Text style={s.message}>{message}</Text>
          </View>

          <View style={s.btns}>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.TEXT_SECONDARY }]}
              onPress={onClose}
            >
              <Text style={s.btnTxt}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.EXCLUIR_MAIN_COLOR }]}
              onPress={onConfirm}
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
      padding: 16,
    },
    box: {
      width: "100%",
      backgroundColor: colors.BACKGROUND,
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
      color: colors.TEXT_PRIMARY,
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.TEXT_PRIMARY,
    },
    message: {
      fontSize: 14,
      color: colors.EXCLUIR_MAIN_COLOR,
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
      color: colors.BACKGROUND,
      fontWeight: "600",
      fontSize: 14,
    },
  });
