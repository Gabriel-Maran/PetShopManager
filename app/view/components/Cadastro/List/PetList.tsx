import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ButtonEditar from "../Botões/ButtonEditar";
import ButtonExcluir from "../Botões/Delete/ButtonExcluir";
import { PetWithSpecieRaceAndOwner } from "../../../../model/Pet";
import {
  EspeciesAtendidas,
  NewOrEditCadastros,
  Screen,
} from "../../../../config/consts";
import { ThemeColors, useThemedStyles } from "../../../Themes/ThemeProvider";
import { EspeciesAtendidasLabel } from "../../../../config/consts";
import ButtonAtivar from "../Botões/ButtonAtivar";
import { useScreen } from "../../../../hooks/useScreen";

export default function PetList({
  cadastros,
  onDeactivate,
  saoAtivados,
  onActivate,
}: {
  cadastros: PetWithSpecieRaceAndOwner[];
  onDeactivate: (itemId: number) => void;
  onActivate: (itemId: number) => void;
  saoAtivados: boolean;
}) {
  const s = useThemedStyles(styles);
  const { navigate } = useScreen();

  return (
    <View>
      <FlatList
        data={cadastros}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigate(Screen.NewOrEditPet, {
                mode: "view",
                pet: item,
              })
            }
            style={s.itemCard}
          >
            <Image
              style={s.img}
              source={require("../../../../assets/animais/pet.png")}
            />

            <View style={s.mainContent}>
              <View style={{ flexDirection: "row" }}>
                <Text style={s.textMain}>{item.nome}</Text>
              </View>
              <Text style={s.textSub}>
                {item.nome_dono}
                {"\n"}
                {`${EspeciesAtendidasLabel[item.nome_especie as EspeciesAtendidas]}${item.nome_raca ? ` - ${item.nome_raca}` : ""}`}
              </Text>
            </View>
            <ButtonEditar
              navegarPara={Screen.NewOrEditPet}
              selectParam={
                {
                  mode: "edit",
                  pet: item,
                } as NewOrEditCadastros
              }
            />
            {saoAtivados ? (
              <ButtonExcluir itemId={item.id ?? -1} onDeactivate={onDeactivate} />
            ) : (
              <ButtonAtivar itemId={item.id ?? -1} onActivate={onActivate} />
            )}
          </TouchableOpacity>
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
