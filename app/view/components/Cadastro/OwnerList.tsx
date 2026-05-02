import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { Owner } from "../../../model/Owner";

export default function OwnerList({ items }: { items: Owner[] }) {
  return (
    <View>
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <Image
              style={styles.img}
              source={require("../../../assets/person.png")}
            />
            <View style={styles.mainContent}>
              <Text style={styles.textMain}>{item.nome}</Text>
              <Text style={styles.textSub}>{item.telefone}</Text>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  itemCard: {
    height: 90,
    width: "95%",
    alignSelf: "center",
    flexDirection: "row",
    gap: 10,
  },
  mainContent: {
    alignSelf: "center",
    gap: 5,
    maxWidth: "72%",
  },
  img: {
    width: 30,
    height: 30,
    alignSelf: "center",
  },
  textMain: {
    fontSize: 18,
    fontWeight: "bold",
  },
  textSub: {
    fontSize: 12,
    color: "#646462",
  },
});
