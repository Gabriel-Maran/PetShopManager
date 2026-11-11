import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../../theme/ThemeProvider";
import { TINT_OPACITY, withAlpha } from "../../../theme/alpha";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { isoToBr } from "../../../../utils/dates";
import { HIDDEN_FROM_SCREEN_READER } from "../../accessibility/accessibilityProps";
import CloseButton from "../../CloseButton";
import { DatePickerCalendar } from "./DatePickerCalendarProps";
import {
  FONT_SIZE,
  FONT_WEIGHT,
  LETTER_SPACINGS,
  RADIUS,
  SPACING,
} from "../../../theme/tokens";

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
      paddingHorizontal: SPACING[20],
    },
    card: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: colors.BACKGROUND,
      borderRadius: RADIUS[16],
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
      paddingHorizontal: SPACING[18],
      paddingTop: SPACING[18],
      paddingBottom: SPACING[10],
    },
    title: {
      fontSize: FONT_SIZE.SUBTITLE_LARGE,
      fontWeight: FONT_WEIGHT.BOLD,
      color: colors.TEXT_PRIMARY,
    },
    preview: {
      marginHorizontal: SPACING[18],
      marginBottom: SPACING[4],
      paddingVertical: SPACING[8],
      paddingHorizontal: SPACING[14],
      backgroundColor: withAlpha(
        colors.PRIMARY_CONTRAST,
        TINT_OPACITY.SELECTED_DATE,
      ),
      borderRadius: RADIUS[8],
      alignItems: "center",
    },
    previewText: {
      fontSize: FONT_SIZE.BODY_LARGE,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
      color: colors.PRIMARY_CONTRAST,
      letterSpacing: LETTER_SPACINGS.SLIGHT,
    },
    footer: {
      flexDirection: "row",
      gap: SPACING[10],
      padding: SPACING[16],
    },
    btn: {
      flex: 1,
      paddingVertical: SPACING[13],
      borderRadius: RADIUS[10],
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
      fontSize: FONT_SIZE.BODY_LARGE,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
    },
  });
