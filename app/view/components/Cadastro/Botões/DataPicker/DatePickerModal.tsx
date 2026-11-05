// ─── DatePickerModal ──────────────────────────────────────────────────────────

import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../../../Themes/ThemeProvider";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { hifen_para_br } from "../../../../../utils/dataPicker/dataPickerAux";
import { DatePickerCalendar } from "./DatePickerCalendarProps";

interface DatePickerModalProps {
  visible: boolean;
  value?: string;
  onChange: (date: string) => void;
  onClose: () => void;
  onConfirm: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  title?: string;
}

export function DatePickerModal({
  visible,
  value,
  onChange,
  onClose,
  onConfirm,
  minDate,
  maxDate,
  title = "Selecione uma data",
}: DatePickerModalProps) {
  const { colors } = useTheme();
  const s = useThemedStyles(modalStyles);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable style={s.backdrop} onPress={onClose} />

      {/* Card */}
      <View style={s.centeredView} pointerEvents="box-none">
        <View style={s.card}>
          {/* Cabeçalho */}
          <View style={s.header}>
            <Text style={s.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={s.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Data selecionada (preview) */}
          {value && (
            <View style={s.preview}>
              <Text style={s.previewText}>{hifen_para_br(value)}</Text>
            </View>
          )}

          {/* Calendário */}
          <DatePickerCalendar
            value={value}
            onChange={onChange}
            minDate={minDate}
            maxDate={maxDate}
          />

          {/* Rodapé */}
          <View style={s.footer}>
            <TouchableOpacity
              style={[s.btn, s.btnOutline]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[s.btnText, { color: colors.TEXT_SECONDARY }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.btn, s.btnPrimary, !value && s.btnDisabled]}
              onPress={() => value && onConfirm(value)}
              activeOpacity={0.7}
              disabled={!value}
            >
              <Text style={[s.btnText, { color: "#FFFFFF" }]}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    centeredView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    card: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: colors.BACKGROUND,
      borderRadius: 16,
      overflow: "hidden",
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 10,
    },
    title: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.TEXT_PRIMARY,
    },
    closeBtn: {
      fontSize: 16,
      color: colors.TEXT_SECONDARY,
    },
    preview: {
      marginHorizontal: 18,
      marginBottom: 4,
      paddingVertical: 8,
      paddingHorizontal: 14,
      backgroundColor: colors.PRIMARY_CONTRAST + "22", // 13% opacidade
      borderRadius: 8,
      alignItems: "center",
    },
    previewText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.PRIMARY_CONTRAST,
      letterSpacing: 0.5,
    },
    footer: {
      flexDirection: "row",
      gap: 10,
      padding: 16,
    },
    btn: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: 10,
      alignItems: "center",
    },
    btnOutline: {
      borderWidth: 1.5,
      borderColor: colors.BORDER_STRONG,
    },
    btnPrimary: {
      backgroundColor: colors.PRIMARY_CONTRAST,
    },
    btnDisabled: {
      opacity: 0.4,
    },
    btnText: {
      fontSize: 15,
      fontWeight: "600",
    },
  });
