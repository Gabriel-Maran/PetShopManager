import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../../../Themes/ThemeProvider";
import { TINT_OPACITY, withAlpha } from "../../../../Themes/alpha";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { isoToBr } from "../../../../../utils/datas";
import { HIDDEN_FROM_SCREEN_READER } from "../../../Acessibilidade/accessibilityProps";
import CloseButton from "../../../CloseButton";
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
      {/* Backdrop: fechar pelo leitor de tela é com o botão Fechar ou o voltar do Android. */}
      <Pressable
        style={s.backdrop}
        onPress={onClose}
        {...HIDDEN_FROM_SCREEN_READER}
      />

      {/* Card */}
      <View style={s.centeredView} pointerEvents="box-none">
        <View style={s.card}>
          {/* Cabeçalho */}
          <View style={s.header}>
            <Text style={s.title} accessibilityRole="header">
              {title}
            </Text>
            <CloseButton onPress={onClose} />
          </View>

          {/* Data selecionada (preview) */}
          {value && (
            <View style={s.preview}>
              <Text style={s.previewText}>{isoToBr(value)}</Text>
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
              accessibilityRole="button"
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
              accessibilityRole="button"
            >
              {/* Texto sobre o verde cheio usa a cor do fundo: escuro no tema escuro, branco no claro. */}
              <Text style={[s.btnText, { color: colors.BACKGROUND }]}>
                Confirmar
              </Text>
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
      backgroundColor: colors.MODAL_BACKGROUND,
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
      shadowColor: colors.SHADOW,
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
    preview: {
      marginHorizontal: 18,
      marginBottom: 4,
      paddingVertical: 8,
      paddingHorizontal: 14,
      backgroundColor: withAlpha(
        colors.PRIMARY_CONTRAST,
        TINT_OPACITY.SELECTED_DATE,
      ),
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
