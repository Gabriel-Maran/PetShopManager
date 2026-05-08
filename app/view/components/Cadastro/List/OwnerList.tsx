import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { Owner } from "../../../../model/Owner";
import { useScreen } from "../../../../hooks/useScreen";
import ButtonEditar from "../Botões/ButtonEditar";
import { COLORS, Screen } from "../../../../config/consts";
import ButtonExcluir from "../Botões/Delete/ButtonExcluir";

export default function OwnerList({
  cadastros,
  onDelete,
}: {
  cadastros: Owner[];
  onDelete: (itemId: number) => void;
}) {
  const { params } = useScreen();
  return (
    <View>
      <FlatList
        data={cadastros}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <Image
              style={styles.img}
              source={require("../../../../assets/crud/person.png")}
            />

            <View style={styles.mainContent}>
              <Text style={styles.textMain}>{item.nome}</Text>
              <Text style={styles.textSub}>{item.telefone}</Text>
            </View>

            <ButtonEditar
              selectParam={item}
              navegarPara={Screen.NewOrEditOwner}
            />

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
    borderColor: COLORS.BORDER_MID,
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
    tintColor: COLORS.TEXT_PRIMARY,
  },
  textMain: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
  },
  textSub: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
  },

  ctnDelete: {
    alignSelf: "center",
    justifyContent: "flex-end",
  },

  iconDelete: {
    height: 28,
    width: 28,
  },
});
