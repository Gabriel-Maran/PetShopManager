import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Owner } from "../../../../model/Owner";
import { COLORS } from "../../../../config/consts";

export default function OwnerListModal({
  item,
  onSelect,
}: {
  item: Owner;
  onSelect: (item: Owner) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => onSelect(item)}
      activeOpacity={0.6}
    >
      <View style={styles.avatarWrap}>
        <Image
          style={styles.img}
          source={require("../../../../assets/crud/person.png")}
        />
      </View>

      <View style={styles.mainContent}>
        <Text style={styles.textMain}>{item.nome}</Text>
        <Text style={styles.textSub}>{item.telefone}</Text>
      </View>

      <Image
        source={require("../../../../assets/setas/setaDireita.png")}
        style={styles.btnDireita}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.BORDER_MID,
    gap: 12,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY_SOFT ?? "#E6F7F7",
    justifyContent: "center",
    alignItems: "center",
  },
  img: {
    width: 22,
    height: 22,
    tintColor: COLORS.PRIMARY ?? "#0E9599",
  },
  mainContent: {
    flex: 1,
  },
  textMain: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  textSub: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    marginTop: 2,
  },
  btnDireita: {
    width: 38,
    height: 38,
    tintColor: COLORS.TEXT_MUTED,
    opacity: 0.5,
  },
});
