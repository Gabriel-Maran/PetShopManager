import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Screen,
  APP_BAR_HEIGHT,
  EspeciesAtendidasLabel,
  EspeciesAtendidas,
  TipoServico,
} from "../../config/consts";
import { useScreen } from "../../hooks/useScreen";

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
  const appointments = [
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
  ];
  const { navigate } = useScreen();

  return (
    <View style={[styles.container, { marginTop: margemSuperior }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigate(Screen.NewOrEditAppointment)}
        >
          <Image source={require("../../assets/add.png")} style={styles.icon} />
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
                ? require("../../assets/diminuir.png")
                : require("../../assets/expandir.png")
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
                  item.foto === EspeciesAtendidas.CAO
                    ? require("../../assets/caoGreen.png")
                    : item.foto === EspeciesAtendidas.GATO
                      ? require("../../assets/gatoGreen.png")
                      : require("../../assets/interrogacaoGreen.png")
                }
                style={styles.imgPetImg}
              />
            </View>

            <View style={styles.info}>
              <Text style={styles.petName}>{item.petName}</Text>
              <Text style={styles.ownerName}>{item.ownerName}</Text>
            </View>

            <View style={styles.right}>
              <View style={styles.servicoBadge}>
                <Text style={styles.servicoTxt}>{item.servico}</Text>
              </View>
              <Text style={styles.time}>{item.time}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const TEAL = "#0E9599";
const TEAL_LIGHT = "#E6F7F7";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: APP_BAR_HEIGHT,
    width: "100%",
    backgroundColor: "#fff",
  },

  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#EFEFEF",
  },
  titleBlock: {
    flex: 1,
    alignItems: "center",
  },
  titleLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: TEAL,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  titleDate: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    marginTop: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: TEAL_LIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 22,
    height: 22,
    tintColor: TEAL,
  },

  // ── Lista ────────────────────────────────────────────────
  list: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    backgroundColor: "#fff",
  },

  // Avatar
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 20,
    backgroundColor: TEAL_LIGHT,
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
    color: "#111",
  },
  ownerName: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },

  // Lado direito: badge + horário
  right: {
    alignItems: "flex-end",
    gap: 4,
  },
  servicoBadge: {
    backgroundColor: TEAL_LIGHT,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  servicoTxt: {
    fontSize: 13,
    fontWeight: "600",
    color: TEAL,
  },
  time: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
  },

  // ── Empty ────────────────────────────────────────────────
  empty: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyTxt: {
    color: "#aaa",
    fontSize: 18,
  },
});
