import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { Owner } from "../../../model/Owner";
import { Screen } from "../../../config/consts";
import ButtonExcluir from "./Botões/ButtonExcluir";
import ButtonEditar from "./Botões/ButtonEditar";

export default function OwnerList({ cadastros }: { cadastros: Owner[] }) {
  return (
    <View>
      <FlatList
        data={cadastros}
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

            <ButtonEditar navegarPara={Screen.NewOrEditOwner} />

            <ButtonExcluir />
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
    alignSelf: "center",
    padding: 10,
    height: 90,
    width: "95%",
    gap: 10,
    borderBottomWidth: 1,
    borderColor: "#b5b5b5",
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

  ctnDelete: {
    alignSelf: "center",
    justifyContent: "flex-end",
  },

  btnDelete: {
    marginLeft: 10,
    backgroundColor: "#FCEBEB",
    padding: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#F09595",
  },

  iconDelete: {
    height: 28,
    width: 28,
  },
});
