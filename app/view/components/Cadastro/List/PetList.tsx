import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import ButtonEditar from "../Botões/ButtonEditar";
import ButtonExcluir from "../Botões/Delete/ButtonExcluir";
import { Pet } from "../../../../model/Pet";
import { Screen } from "../../../../config/consts";

export default function PetList({
  cadastros,
  onDelete,
}: {
  cadastros: Pet[];
  onDelete: (itemId: number) => void;
}) {
  return (
    <View>
      <FlatList
        data={cadastros}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <Image
              style={styles.img}
              source={require("../../../../assets/animais/pet.png")}
            />

            <View style={styles.mainContent}>
              <Text style={styles.textMain}>{item.nome}</Text>
              <Text style={styles.textSub}>
                {`${item.especie}${item.raca ? ` - ${item.raca}` : ""}`}
              </Text>
            </View>

            <ButtonEditar navegarPara={Screen.NewOrEditPet} />

            <ButtonExcluir itemId={item.id ?? -1} onDelete={onDelete} />
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
});
