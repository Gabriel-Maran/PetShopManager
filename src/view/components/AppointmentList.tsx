import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { useScreen } from "../../hooks/useScreen";
import { useError } from "../../hooks/useError";

import { Screen, APP_BAR_HEIGHT, SpeciesCode } from "../../config/consts";

import { appointmentController } from "../../controller/AppointmentsController";

import { isoToBr } from "../../utils/dates";
import { ThemeColors, useThemedStyles } from "../theme/ThemeProvider";
import { useCalendar } from "../contexts/CalendarContext";
import { A11Y_LABELS } from "../../globals/accessibilityLabels";
import IconButton from "./accessibility/IconButton";
import { FONT_SIZE, FONT_WEIGHT, LETTER_SPACINGS, RADIUS, SPACING } from "../theme/tokens";

const ICON_BUTTON_SIZE = 38;

export default function AppointmentList({
  isFullScreen,
  topMargin,
  setFullScreen,
}: {
  isFullScreen: boolean;
  topMargin: number;
  setFullScreen: (isFullScreen: boolean) => void;
}) {
  const { navigate } = useScreen();
  const { showError } = useError();
  const s = useThemedStyles(styles);
  const { dateSelected, appointments, setAppointments } = useCalendar();

  // Recarrega ao voltar para o Calendário, porque outra tela pode ter mudado a agenda.
  useFocusEffect(
    useCallback(() => {
      appointmentController
        .getAppointmentsByDateWithOwnerAndPet(dateSelected)
        .then(setAppointments)
        .catch(showError);
    }, [dateSelected, setAppointments, showError]),
  );

  return (
    <View style={[s.container, { marginTop: topMargin }]}>
      <View style={s.header}>
        <IconButton
          label={A11Y_LABELS.appointments.add}
          width={ICON_BUTTON_SIZE}
          style={s.iconBtn}
          onPress={() => navigate(Screen.NewOrEditAppointment, { dateSelected })}
        >
          <Image source={require("../../assets/crud/add.png")} style={s.icon} />
        </IconButton>

        <View style={s.titleBlock} accessible accessibilityRole="header">
          <Text style={s.titleLabel}>Agendamentos</Text>
          <Text style={s.titleDate}>{isoToBr(dateSelected)}</Text>
        </View>

        <IconButton
          label={isFullScreen ? A11Y_LABELS.appointments.collapse : A11Y_LABELS.appointments.expand}
          width={ICON_BUTTON_SIZE}
          accessibilityState={{ expanded: isFullScreen }}
          style={s.iconBtn}
          onPress={() => setFullScreen(!isFullScreen)}
        >
          <Image
            source={
              isFullScreen
                ? require("../../assets/arrows/collapse.png")
                : require("../../assets/arrows/expand.png")
            }
            style={s.icon}
          />
        </IconButton>
      </View>

      <FlatList
        data={appointments}
        style={s.list}
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={() => <View style={s.separator} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTxt}>Nenhum agendamento neste dia.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.row}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel={A11Y_LABELS.appointments.item({
              pet: item.pet_name,
              owner: item.owner_name,
              service: item.service,
              time: item.time,
              done: Boolean(item.completed),
            })}
            onPress={() => navigate(Screen.NewOrEditAppointment, { appointment: item })}
          >
            <View style={!item.completed ? s.avatar : s.avatarDone}>
              <Image
                source={
                  item.species_name === SpeciesCode.Dog
                    ? require("../../assets/animals/dogGreen.png")
                    : item.species_name === SpeciesCode.Cat
                      ? require("../../assets/animals/catGreen.png")
                      : require("../../assets/animals/questionGreen.png")
                }
                style={!item.completed ? s.petImg : s.imgPetImgDone}
              />
            </View>

            <View style={s.info}>
              <Text style={!item.completed ? s.petName : s.petNameDone}>{item.pet_name}</Text>
              <Text style={s.ownerName}>{item.owner_name}</Text>
            </View>

            <View style={s.right}>
              <View style={s.serviceBadge}>
                <Text style={!item.completed ? s.serviceTxt : s.serviceTxtDone}>
                  {item.service}
                </Text>
              </View>
              <Text style={s.time}>{item.time}</Text>
            </View>

            {item.completed ? <View pointerEvents="none" style={s.strikeLine} /> : null}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      marginBottom: APP_BAR_HEIGHT,
      width: "100%",
      backgroundColor: colors.BACKGROUND,
    },

    // ── Header ──────────────────────────────────────────────
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: SPACING[10],
      paddingHorizontal: SPACING[12],
      backgroundColor: colors.BACKGROUND,
      borderBottomWidth: 1,
      borderColor: colors.SURFACE_VARIANT,
    },
    titleBlock: {
      flex: 1,
      alignItems: "center",
    },
    titleLabel: {
      fontSize: FONT_SIZE.OVERLINE,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
      color: colors.PRIMARY,
      letterSpacing: LETTER_SPACINGS.LABEL_SM,
      textTransform: "uppercase",
    },
    titleDate: {
      fontSize: FONT_SIZE.BODY_LARGE,
      fontWeight: FONT_WEIGHT.BOLD,
      color: colors.TEXT_PRIMARY,
      marginTop: SPACING[1],
    },
    iconBtn: {
      width: ICON_BUTTON_SIZE,
      height: ICON_BUTTON_SIZE,
      borderRadius: RADIUS[10],
      backgroundColor: colors.BACKGROUND,
      justifyContent: "center",
      alignItems: "center",
    },
    icon: {
      width: 22,
      height: 22,
      tintColor: colors.PRIMARY,
    },

    // ── Lista ────────────────────────────────────────────────
    list: {
      flex: 1,
    },
    separator: {
      height: 1,
      backgroundColor: colors.BORDER,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SPACING[14],
      paddingVertical: SPACING[11],
      gap: SPACING[10],
      backgroundColor: colors.BACKGROUND,
    },
    strikeLine: {
      position: "absolute",
      left: 14,
      right: 14,
      height: 4,
      borderRadius: RADIUS[10],
      backgroundColor: colors.BORDER_MID,
    },

    // Avatar
    avatar: {
      width: 44,
      height: 44,
      borderRadius: RADIUS[20],
      backgroundColor: colors.PRIMARY_SOFT,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarDone: {
      width: 44,
      height: 44,
      borderRadius: RADIUS[20],
      backgroundColor: colors.BORDER_LIGHT,
      justifyContent: "center",
      alignItems: "center",
    },
    petImg: {
      width: 30,
      height: 30,
    },
    imgPetImgDone: {
      width: 30,
      height: 30,
      tintColor: colors.BORDER_MID,
    },

    // Infos
    info: {
      flex: 1,
    },
    petName: {
      fontSize: FONT_SIZE.SUBTITLE,
      fontWeight: FONT_WEIGHT.BOLD,
      color: colors.TEXT_PRIMARY,
    },
    petNameDone: {
      fontSize: FONT_SIZE.SUBTITLE,
      fontWeight: FONT_WEIGHT.BOLD,
      color: colors.TEXT_PLACEHOLDER,
    },
    // Textos cinza usam TEXT_MUTED: a cor de borda não passa de 4,5:1 como texto.
    ownerName: {
      fontSize: FONT_SIZE.BODY,
      color: colors.TEXT_MUTED,
      marginTop: SPACING[2],
    },

    // Lado direito: badge + horário
    right: {
      alignItems: "flex-end",
      gap: SPACING[4],
    },
    serviceBadge: {
      backgroundColor: colors.BACKGROUND,
      borderRadius: RADIUS[6],
      paddingHorizontal: SPACING[8],
      paddingVertical: SPACING[3],
    },
    serviceTxt: {
      fontSize: FONT_SIZE.BODY_SMALL,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
      color: colors.PRIMARY,
    },
    serviceTxtDone: {
      fontSize: FONT_SIZE.BODY_SMALL,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
      color: colors.TEXT_MUTED,
    },
    time: {
      fontSize: FONT_SIZE.BODY_LARGE,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
      color: colors.TEXT_MUTED,
    },

    // ── Empty ────────────────────────────────────────────────
    empty: {
      paddingVertical: SPACING[40],
      alignItems: "center",
    },
    emptyTxt: {
      color: colors.TEXT_MUTED,
      fontSize: FONT_SIZE.TITLE_SMALL,
    },
  });
