import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Pet } from "../../../model/Pet";

export default function OwnerList({ items }: { items: Pet[] }) {
  return (
    <View>
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <Image
              style={styles.img}
              source={require("../../../assets/pet.png")}
            />
            <View style={styles.mainContent}>
              <Text style={styles.textMain}>{item.nome}</Text>
              <Text style={styles.textSub}>
                {`${item.especie}${item.raca ? ` - ${item.raca}` : ""}`}
              </Text>
            </View>
            <View style={styles.ctnEdit}>
              <TouchableOpacity style={styles.btnEdit}>
                <Image
                  style={styles.iconEdit}
                  source={require("../../../assets/edit.png")}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.ctnDelete}>
              <TouchableOpacity style={styles.btnDelete}>
                <Image
                  style={styles.iconDelete}
                  source={require("../../../assets/delete.png")}
                />
              </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    height: 90,
    width: "95%",
    gap: 10,
  },
  mainContent: {
    flex: 1,
    marginLeft: 10,
    alignSelf: "center",
    gap: 5,
  },
  img: {
    width: 30,
    height: 30,
    alignSelf: "center",
  },
  textMain: {
    fontSize: 16,
    fontWeight: "bold",
  },
  textSub: {
    fontSize: 12,
    color: "#646462",
  },
  ctnEdit: {
    alignSelf: "center",
  },
  ctnDelete: {
    alignSelf: "center",
    justifyContent: "flex-end",
  },
  btnEdit: {
    backgroundColor: "#E1F5EE",
    padding: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#1D9E75",
  },
  btnDelete: {
    marginLeft: 10,
    backgroundColor: "#FCEBEB",
    padding: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#F09595",
  },
  iconEdit: {
    height: 28,
    width: 28,
  },
  iconDelete: {
    height: 28,
    width: 28,
  },
});
