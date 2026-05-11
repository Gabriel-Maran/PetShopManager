import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import ButtonEditar from "../Botões/ButtonEditar";
import ButtonExcluir from "../Botões/Delete/ButtonExcluir";
import { PetWithSpecieAndRace } from "../../../../model/Pet";
import { EspeciesAtendidas, Screen } from "../../../../config/consts";
import { ThemeColors, useThemedStyles } from "../../../Themes/ThemeProvider";
import { EspeciesAtendidasLabel } from "../../../../config/consts";
import ButtonAtivar from "../Botões/ButtonAtivar";

export default function PetList({
  cadastros,
  onDelete,
  saoAtivados,
  onActive,
}: {
  cadastros: PetWithSpecieAndRace[];
  onDelete: (itemId: number) => void;
  onActive: (itemId: number) => void;
  saoAtivados: boolean;
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
                {`${EspeciesAtendidasLabel[item.nome_especie as EspeciesAtendidas]}${item.nome_raca ? ` - ${item.nome_raca}` : ""}`}
              </Text>
            </View>
            <ButtonEditar navegarPara={Screen.NewOrEditPet} />
            {saoAtivados ? (
              <ButtonExcluir itemId={item.id ?? -1} onDelete={onDelete} />
            ) : (
              <ButtonAtivar itemId={item.id ?? -1} onActive={onActive} />
            )}
          </View>
        )}
        keyExtractor={(item) => String(item.id)}
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
      borderColor: colors.BORDER_MID,
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
      tintColor: colors.TEXT_PRIMARY,
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
