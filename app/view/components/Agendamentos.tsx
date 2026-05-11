import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect } from "react";

import { useScreen } from "../../hooks/useScreen";
import { useError } from "../../hooks/useError";

import { Screen, APP_BAR_HEIGHT, EspeciesAtendidas } from "../../config/consts";

import { appointmentController } from "../../controller/AppointmentsController";

import { DataStringPraNumber } from "../../utils/converterData";
import { ThemeColors, useThemedStyles } from "../Themes/ThemeProvider";
import { useAgendamentos } from "../contexts/agendamentos";

export default function Agendamentos({
  isFullScreen,
  margemSuperior,
  setFullScreen,
}: {
  isFullScreen: boolean;
  margemSuperior: number;
  setFullScreen: (isFullScreen: boolean) => void;
}) {
  const { navigate } = useScreen();
  const { showError } = useError();
  const s = useThemedStyles(styles);
  const { dateSelected, appointments, setAppointments } = useAgendamentos();

  const handleError = (e: unknown) =>
    showError(e instanceof Error ? e.message : "Erro inesperado.");

  useEffect(() => {
    const fetch = appointmentController
      .getAppointmentsByDateWithOwnerAndPet(
        DataStringPraNumber(dateSelected, "-"),
      )
      .then(setAppointments);
    fetch.catch(handleError);
  }, [dateSelected]);

  return (
    <View style={[s.container, { marginTop: margemSuperior }]}>
      <View style={s.header}>
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() =>
            navigate(Screen.NewOrEditAppointment, { dateSelected })
          }
        >
          <Image source={require("../../assets/crud/add.png")} style={s.icon} />
        </TouchableOpacity>

        <View style={s.titleBlock}>
          <Text style={s.titleLabel}>Agendamentos</Text>
          <Text style={s.titleDate}>
            {dateSelected.split("-").reverse().join("/")}
          </Text>
        </View>

        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => setFullScreen(!isFullScreen)}
        >
          <Image
            source={
              isFullScreen
                ? require("../../assets/setas/diminuir.png")
                : require("../../assets/setas/expandir.png")
            }
            style={s.icon}
          />
        </TouchableOpacity>
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
            onPress={() =>
              navigate(Screen.NewOrEditAppointment, { appointment: item })
            }
          >
            <View style={s.avatar}>
              <Image
                source={
                  item.especie === EspeciesAtendidas.CAO
                    ? require("../../assets/animais/caoGreen.png")
                    : item.especie === EspeciesAtendidas.GATO
                      ? require("../../assets/animais/gatoGreen.png")
                      : require("../../assets/animais/interrogacaoGreen.png")
                }
                style={s.imgPetImg}
              />
            </View>

            <View style={s.info}>
              <Text style={s.petName}>{item.nome_pet}</Text>
              <Text style={s.ownerName}>{item.nome_dono}</Text>
            </View>

            <View style={s.right}>
              <View style={s.servicoBadge}>
                <Text style={s.servicoTxt}>{item.servico}</Text>
              </View>
              <Text style={s.time}>{item.hora}</Text>
            </View>
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
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: colors.BACKGROUND,
      borderBottomWidth: 1,
      borderColor: colors.SURFACE_VARIANT,
    },
    titleBlock: {
      flex: 1,
      alignItems: "center",
    },
    titleLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.PRIMARY,
      letterSpacing: 1.1,
      textTransform: "uppercase",
    },
    titleDate: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.TEXT_PRIMARY,
      marginTop: 1,
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 10,
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
      paddingHorizontal: 14,
      paddingVertical: 11,
      gap: 10,
      backgroundColor: colors.BACKGROUND,
    },

    // Avatar
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 20,
      backgroundColor: colors.PRIMARY_SOFT,
      justifyContent: "center",
      alignItems: "center",
    },
    imgPetImg: {
      width: 30,
      height: 30,
    },

    // Infos
    info: {
      flex: 1,
    },
    petName: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.TEXT_PRIMARY,
    },
    ownerName: {
      fontSize: 14,
      color: colors.BORDER_STRONG,
      marginTop: 2,
    },

    // Lado direito: badge + horário
    right: {
      alignItems: "flex-end",
      gap: 4,
    },
    servicoBadge: {
      backgroundColor: colors.BACKGROUND,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    servicoTxt: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.PRIMARY,
    },
    time: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.BORDER_STRONG,
    },

    // ── Empty ────────────────────────────────────────────────
    empty: {
      paddingVertical: 40,
      alignItems: "center",
    },
    emptyTxt: {
      color: colors.BORDER_STRONG,
      fontSize: 18,
    },
  });
