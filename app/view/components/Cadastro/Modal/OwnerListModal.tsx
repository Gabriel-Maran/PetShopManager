import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Owner } from "../../../../model/Owner";
import { ThemeColors, useThemedStyles } from "../../../Themes/ThemeProvider";

export default function OwnerListModal({
  item,
  onSelect,
}: {
  item: Owner;
  onSelect: (item: Owner) => void;
}) {
  const s = useThemedStyles(styles);
  return (
    <TouchableOpacity
      style={s.itemCard}
      onPress={() => onSelect(item)}
      activeOpacity={0.6}
    >
      <View style={s.avatarWrap}>
        <Image
          style={s.img}
          source={require("../../../../assets/crud/person.png")}
        />
      </View>

      <View style={s.mainContent}>
        <Text style={s.textMain}>{item.nome}</Text>
        <Text style={s.textSub}>{item.telefone}</Text>
      </View>

      <Image
        source={require("../../../../assets/setas/setaDireita.png")}
        style={s.chevron}
      />
    </TouchableOpacity>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    itemCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderColor: colors.BORDER_MID,
      gap: 12,
    },
    avatarWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.PRIMARY_SOFT ?? "#E6F7F7",
      justifyContent: "center",
      alignItems: "center",
    },
    img: {
      width: 22,
      height: 22,
      tintColor: colors.PRIMARY ?? "#0E9599",
    },
    mainContent: {
      flex: 1,
    },
    textMain: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.TEXT_PRIMARY,
    },
    textSub: {
      fontSize: 12,
      color: colors.TEXT_MUTED,
      marginTop: 2,
    },

    chevron: {
      width: 14,
      height: 14,
      tintColor: colors.TEXT_MUTED,
      opacity: 0.5,
    },
  });
