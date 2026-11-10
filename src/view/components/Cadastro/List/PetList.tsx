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
import { A11Y_LABELS } from "../../../../globals/accessibilityLabels";
import { FONT_SIZE, FONT_WEIGHT, SPACING } from "../../../Themes/tokens";

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
            accessibilityRole="button"
            accessibilityHint={A11Y_LABELS.registry.openPetHint}
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
              label={A11Y_LABELS.registry.edit(item.nome)}
              navegarPara={Screen.NewOrEditPet}
              selectParam={
                {
                  mode: "edit",
                  pet: item,
                } as NewOrEditCadastros
              }
            />
            {saoAtivados ? (
              <ButtonExcluir
                label={A11Y_LABELS.registry.deactivate(item.nome)}
                itemId={item.id ?? -1}
                onDeactivate={onDeactivate}
              />
            ) : (
              <ButtonAtivar
                label={A11Y_LABELS.registry.activate(item.nome)}
                itemId={item.id ?? -1}
                onActivate={onActivate}
              />
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
      padding: SPACING[10],
      height: 90,
      width: "95%",
      gap: SPACING[10],
      borderBottomWidth: 1,
      borderColor: colors.BORDER_MID,
    },
    mainContent: {
      flex: 1,
      marginLeft: SPACING[10],
      alignSelf: "center",
      gap: SPACING[5],
    },
    img: {
      width: 30,
      height: 30,
      alignSelf: "center",
      tintColor: colors.TEXT_PRIMARY,
    },
    textMain: {
      fontSize: FONT_SIZE.SUBTITLE,
      fontWeight: FONT_WEIGHT.BOLD,
      color: colors.TEXT_PRIMARY,
    },
    textSub: {
      fontSize: FONT_SIZE.SMALL,
      color: colors.TEXT_MUTED,
    },
  });
