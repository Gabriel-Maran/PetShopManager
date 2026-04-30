import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SEARCH_BAR_HEIGHT } from "../../config/consts";

export default function Agendamentos({
  margemSuperior,
}: {
  margemSuperior: number;
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
      }}
    >
      <Text style={styles.title}>Agendamentos *Dia*</Text>
      <FlatList
        data={appointments}
        style={styles.container} // ← remove o marginTop daqui
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              minHeight: 45,
              paddingHorizontal: 10,
            }}
          >
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
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
});
