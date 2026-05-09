import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import ButtonEditar from "../Botões/ButtonEditar";
import ButtonExcluir from "../Botões/Delete/ButtonExcluir";
import { Pet } from "../../../../model/Pet";
import { Screen } from "../../../../config/consts";
import { ThemeColors, useThemedStyles } from "../../../Themes/ThemeProvider";

export default function PetList({
  cadastros,
  onDelete,
}: {
  cadastros: Pet[];
  onDelete: (itemId: number) => void;
}) {
  const s = useThemedStyles(styles);

  return (
    <View>
      <FlatList
        data={cadastros}
        renderItem={({ item }) => (
          <View style={s.itemCard}>
            <Image
              style={s.img}
              source={require("../../../../assets/animais/pet.png")}
            />

            <View style={s.mainContent}>
              <Text style={s.textMain}>{item.nome}</Text>
              <Text style={s.textSub}>
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

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      color: colors.TEXT_PRIMARY,
    },
    textSub: {
      fontSize: 12,
      color: colors.TEXT_MUTED,
    },
  });
