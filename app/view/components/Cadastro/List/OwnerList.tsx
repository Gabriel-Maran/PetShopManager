import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Owner } from "../../../../model/Owner";
import { useScreen } from "../../../../hooks/useScreen";
import ButtonEditar from "../Botões/ButtonEditar";
import { NewOrEditCadastros, Screen } from "../../../../config/consts";
import ButtonExcluir from "../Botões/Delete/ButtonExcluir";
import { ThemeColors, useThemedStyles } from "../../../Themes/ThemeProvider";
import ButtonAtivar from "../Botões/ButtonAtivar";

export default function OwnerList({
  cadastros,
  onDeactivate,
  saoAtivados,
  onActivate,
}: {
  cadastros: Owner[];
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
              navigate(Screen.NewOrEditOwner, {
                mode: "view",
                owner: item,
              })
            }
          >
            <View style={s.itemCard}>
              <Image
                style={s.img}
                source={require("../../../../assets/crud/person.png")}
              />

              <View style={s.mainContent}>
                <Text style={s.textMain}>{item.nome}</Text>
                <Text style={s.textSub}>{item.telefone}</Text>
              </View>

              <ButtonEditar
                selectParam={
                  { owner: item, mode: "edit" } as NewOrEditCadastros
                }
                navegarPara={Screen.NewOrEditOwner}
              />
              {saoAtivados ? (
                <ButtonExcluir itemId={item.id ?? -1} onDeactivate={onDeactivate} />
              ) : (
                <ButtonAtivar itemId={item.id ?? -1} onActivate={onActivate} />
              )}
            </View>
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
