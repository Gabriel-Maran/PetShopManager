import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SEARCH_BAR_HEIGHT } from "../../config/consts";

export default function Agendamentos({
  isFullScreen,
  margemSuperior,
  setFullScreen,
}: {
  isFullScreen: boolean;
  margemSuperior: number;
  setFullScreen: (isFullScreen: boolean) => void;
}) {
  const appointments = [
    { id: 1, petName: "Rex", ownerName: "João", time: "10:00" },
    { id: 2, petName: "Mia", ownerName: "Maria", time: "11:30" },
    { id: 3, petName: "Toby", ownerName: "Carlos", time: "14:00" },
  ];
  return (
    <View
      style={{
        flex: 1,
        marginBottom: SEARCH_BAR_HEIGHT,
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
        <Text style={styles.title}>Agendamentos *Dia*</Text>
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
            <Text style={{ flex: 1 }}>{item.petName}</Text>
            <Text style={{ flex: 1 }}>{item.ownerName}</Text>
            <Text style={{ flex: 1, textAlign: "right" }}>{item.time}</Text>
            <TouchableOpacity
              style={{
                backgroundColor: "#378ADD",
                padding: 5,
                borderRadius: 5,
              }}
              onPress={() => {
                // Lógica para editar o agendamento
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
    fontSize: 20,
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
});
