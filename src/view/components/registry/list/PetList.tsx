import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import EditButton from "../buttons/EditButton";
import DeactivateButton from "../buttons/DeactivateButton";
import { PetWithSpeciesBreedAndOwner } from "../../../../model/Pet";
import { SpeciesCode, RegistryParams, Screen, SpeciesLabel } from "../../../../config/consts";
import { ThemeColors, useThemedStyles } from "../../../theme/ThemeProvider";

import ActivateButton from "../buttons/ActivateButton";
import { useScreen } from "../../../../hooks/useScreen";
import { A11Y_LABELS } from "../../../../globals/accessibilityLabels";
import { FONT_SIZE, FONT_WEIGHT, SPACING } from "../../../theme/tokens";

export default function PetList({
  records,
  onDeactivate,
  areActive,
  onActivate,
}: {
  records: PetWithSpeciesBreedAndOwner[];
  onDeactivate: (itemId: number) => void;
  onActivate: (itemId: number) => void;
  areActive: boolean;
}) {
  const s = useThemedStyles(styles);
  const { navigate } = useScreen();

  return (
    <View>
      <FlatList
        data={records}
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
            <Image style={s.img} source={require("../../../../assets/animals/pet.png")} />

            <View style={s.mainContent}>
              <View style={{ flexDirection: "row" }}>
                <Text style={s.textMain}>{item.name}</Text>
              </View>
              <Text style={s.textSub}>
                {item.owner_name}
                {"\n"}
                {`${SpeciesLabel[item.species_name as SpeciesCode]}${item.breed_name ? ` - ${item.breed_name}` : ""}`}
              </Text>
            </View>
            <EditButton
              label={A11Y_LABELS.registry.edit(item.name)}
              navigateTo={Screen.NewOrEditPet}
              selectParam={
                {
                  mode: "edit",
                  pet: item,
                } as RegistryParams
              }
            />
            {areActive ? (
              <DeactivateButton
                label={A11Y_LABELS.registry.deactivate(item.name)}
                itemId={item.id ?? -1}
                onDeactivate={onDeactivate}
              />
            ) : (
              <ActivateButton
                label={A11Y_LABELS.registry.activate(item.name)}
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
