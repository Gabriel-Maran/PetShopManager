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
      servico: TipoServico.BanhoETosa,
    },
  ];
  const { navigate } = useScreen();

  return (
    <View style={[styles.container, { marginTop: margemSuperior }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn}>
          <Image source={require("../../assets/add.png")} style={styles.icon} />
        </TouchableOpacity>

        <Text style={styles.title}>
          {dateSelected.split("-").reverse().join("/")}
        </Text>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigate(Screen.NewOrEditAppointment)}
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
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTxt}>Nenhum agendamento neste dia.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigate(Screen.Cadastros)}
          >
            <View style={styles.avatar}>
              <Image
                source={
                  item.foto == EspeciesAtendidas.CAO
                    ? require("../../assets/caoGreen.png")
                    : item.foto == EspeciesAtendidas.GATO
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
            <Text style={styles.time}>{item.servico} - </Text>
            <Text style={styles.time}>{item.time}</Text>
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
    backgroundColor: "#fff",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#EFEFEF",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F0FAF6",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 28,
    height: 28,
    tintColor: "#0E9599",
  },

  // Lista
  list: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E1F5EE",
    justifyContent: "center",
    alignItems: "center",
  },
  imgPetImg: {
    width: 28,
    height: 28,
  },
  info: {
    flex: 1,
  },
  petName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  ownerName: {
    fontSize: 12,
    color: "#888",
    marginTop: 1,
  },
  time: {
    fontSize: 16,
    fontWeight: "500",
    color: "#444",
    minWidth: 42,
    textAlign: "right",
  },

  // Empty
  empty: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyTxt: {
    color: "#aaa",
    fontSize: 14,
  },
});
