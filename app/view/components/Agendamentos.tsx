import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Screen, APP_BAR_HEIGHT } from "../../config/consts";
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
    { id: 1, petName: "Rex", ownerName: "João", time: "10:00" },
    { id: 2, petName: "Mia", ownerName: "Maria", time: "11:30" },
    { id: 3, petName: "Toby", ownerName: "Carlos", time: "14:00" },
  ];
  const { screen, navigate } = useScreen();

  return (
    <View
      style={{
        flex: 1,
        marginBottom: APP_BAR_HEIGHT,
        marginTop: margemSuperior,
        width: "100%",
      }}
    >
      <View style={styles.agendamentosHeader}>
        <TouchableOpacity style={styles.btnAdd}>
          <Image
            source={require("../../assets/add.png")}
            style={styles.imgAdd}
          />
        </TouchableOpacity>
        <Text style={styles.title}>
          {dateSelected.split("-").reverse().join("/")}
        </Text>
        <TouchableOpacity
          style={styles.btnFullScreen}
          onPress={() => setFullScreen(!isFullScreen)}
        >
          <Image
            source={
              isFullScreen
                ? require("../../assets/diminuir.png")
                : require("../../assets/expandir.png")
            }
            style={styles.imgFullScreen}
          />
        </TouchableOpacity>
      </View>
      <FlatList
        data={appointments}
        style={styles.container} // ← remove o marginTop daqui
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.agendamentoItem}>
            <Text style={styles.itemAgendamento}>{item.petName}</Text>
            <Text style={styles.itemAgendamento}>{item.ownerName}</Text>
            <Text style={[styles.itemAgendamento, { textAlign: "right" }]}>
              {item.time}
            </Text>
            <TouchableOpacity
              style={styles.btnEditarAgendamento}
              onPress={() => {
                navigate(Screen.Cadastros);
              }}
            >
              <Text style={{ color: "#fff" }}>Editar</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    backgroundColor: "#fff",
    padding: 10,
    flex: 1,
    textAlign: "center",
  },
  agendamentoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 45,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: "#e8e7e7",
  },
  agendamentosHeader: {
    flexDirection: "row",

    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  imgFullScreen: {
    width: 35,
    height: 35,
    marginHorizontal: 10,
  },
  btnFullScreen: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  imgAdd: {
    width: 35,
    height: 35,
    marginHorizontal: 10,
  },
  btnAdd: {
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  itemAgendamento: {
    flex: 1,
  },
  btnEditarAgendamento: {
    backgroundColor: "#0E9599",
    padding: 5,
    borderRadius: 5,
  },
});
