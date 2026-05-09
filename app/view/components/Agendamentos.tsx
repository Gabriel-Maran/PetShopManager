import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useState, useEffect } from "react";

import { useScreen } from "../../hooks/useScreen";
import { useError } from "../../hooks/useError";

import {
  Screen,
  APP_BAR_HEIGHT,
  EspeciesAtendidasLabel,
  EspeciesAtendidas,
  TipoServico,
  COLORS,
} from "../../config/consts";

import { AppointmentWithOwner } from "../../model/Appointment";

import { appointmentController } from "../../controller/AppointmentsController";

export default function Agendamentos({
  isFullScreen,
  margemSuperior,
  setFullScreen,
  dateSelected,
}: {
  isFullScreen: boolean;
  margemSuperior: number;
  setFullScreen: (isFullScreen: boolean) => void;
  dateSelected: string;
}) {
  /*  const appointments = [
    {
      id: 1,
      petName: "Rex",
      ownerName: "João",
      time: "10:00",
      foto: EspeciesAtendidas.CAO,
      servico: TipoServico.Banho,
    },
    {
      id: 2,
      petName: "Mia",
      ownerName: "Maria",
      time: "11:30",
      foto: EspeciesAtendidas.GATO,
      servico: TipoServico.BanhoETosa,
    },
    {
      id: 3,
      petName: "Toby",
      ownerName: "Carlos",
      time: "14:00",
      foto: EspeciesAtendidas.OUTRO,
      servico: TipoServico.Tosa,
    },
  ]; */
  const { navigate } = useScreen();
  const { showError } = useError();

  const handleError = (e: unknown) =>
    showError(e instanceof Error ? e.message : "Erro inesperado.");

  const [appointments, setAppointments] = useState<AppointmentWithOwner[]>();

  useEffect(() => {
    const fetch = appointmentController
      .getAppointmentsByDateWithOwnerAndPet(converterPraNumber(dateSelected))
      .then(setAppointments);
    fetch.catch(handleError);
  }, [dateSelected]);

  function converterPraNumber(dataTexto: string): number {
    const [ano, mes, dia] = dataTexto.split("-");

    return Number(`${ano}${mes}${dia}`);
  }

  return (
    <View style={[styles.container, { marginTop: margemSuperior }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigate(Screen.NewOrEditAppointment)}
        >
          <Image
            source={require("../../assets/crud/add.png")}
            style={styles.icon}
          />
        </TouchableOpacity>

        <View style={styles.titleBlock}>
          <Text style={styles.titleLabel}>Agendamentos</Text>
          <Text style={styles.titleDate}>
            {dateSelected.split("-").reverse().join("/")}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setFullScreen(!isFullScreen)}
        >
          <Image
            source={
              isFullScreen
                ? require("../../assets/setas/diminuir.png")
                : require("../../assets/setas/expandir.png")
            }
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={appointments}
        style={styles.list}
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTxt}>Nenhum agendamento neste dia.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.6}
            onPress={() => navigate(Screen.Cadastros)}
          >
            <View style={styles.avatar}>
              <Image
                source={
                  item.raca_pet === EspeciesAtendidas.CAO
                    ? require("../../assets/animais/caoGreen.png")
                    : item.raca_pet === EspeciesAtendidas.GATO
                      ? require("../../assets/animais/gatoGreen.png")
                      : require("../../assets/animais/interrogacaoGreen.png")
                }
                style={styles.imgPetImg}
              />
            </View>

            <View style={styles.info}>
              <Text style={styles.petName}>{item.nome_pet}</Text>
              <Text style={styles.ownerName}>{item.nome_dono}</Text>
            </View>

            <View style={styles.right}>
              <View style={styles.servicoBadge}>
                <Text style={styles.servicoTxt}>{item.servico}</Text>
              </View>
              <Text style={styles.time}>{item.hora}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: APP_BAR_HEIGHT,
    width: "100%",
    backgroundColor: COLORS.BACKGROUND,
  },

  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.BACKGROUND,
    borderBottomWidth: 1,
    borderColor: COLORS.SURFACE_VARIANT,
  },
  titleBlock: {
    flex: 1,
    alignItems: "center",
  },
  titleLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.PRIMARY,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  titleDate: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 22,
    height: 22,
    tintColor: COLORS.PRIMARY,
  },

  // ── Lista ────────────────────────────────────────────────
  list: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.BORDER,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    backgroundColor: COLORS.BACKGROUND,
  },

  // Avatar
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY_SOFT,
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
    color: COLORS.TEXT_PRIMARY,
  },
  ownerName: {
    fontSize: 14,
    color: COLORS.BORDER_STRONG,
    marginTop: 2,
  },

  // Lado direito: badge + horário
  right: {
    alignItems: "flex-end",
    gap: 4,
  },
  servicoBadge: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  servicoTxt: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.PRIMARY,
  },
  time: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.BORDER_STRONG,
  },

  // ── Empty ────────────────────────────────────────────────
  empty: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyTxt: {
    color: COLORS.BORDER_STRONG,
    fontSize: 18,
  },
});
