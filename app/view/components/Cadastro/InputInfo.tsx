import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { COLORS } from "../../../config/consts";

export default function InputInfo({
  image,
  item,
  setItem,
  placeHolder,
  titleName,
  hasBorderBottom = false,
  variasLinhas,
}: {
  image: ImageSourcePropType;
  item: string;
  setItem: (item: any) => void;
  placeHolder: string;
  titleName: string;
  hasBorderBottom?: boolean;
  variasLinhas: boolean;
}) {
  return (
    <View
      style={[
        styles.ctnInput,
        hasBorderBottom
          ? { borderBottomWidth: 1, borderColor: COLORS.BORDER_LIGHT }
          : { borderWidth: 0 },
      ]}
    >
      <View style={styles.ctnImgInput}>
        <Image style={styles.imgInput} source={image} />
      </View>
      <View style={{ width: "90%", gap: 5 }}>
        <Text style={styles.txtInput}>{titleName.toUpperCase()}</Text>
        <TextInput
          style={styles.input}
          placeholder={placeHolder}
          onChangeText={(item) => setItem(item)}
          value={item}
          multiline={variasLinhas}
          placeholderTextColor={COLORS.TEXT_PRIMARY}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ctnInput: {
    width: "100%",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  imgInput: {
    width: 28,
    height: 28,
    tintColor: COLORS.PRIMARY,
  },
  input: {
    color: COLORS.TEXT_PRIMARY,
    width: "90%",
    minHeight: 45,
    maxHeight: 90,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  ctnImgInput: {
    backgroundColor: COLORS.PRIMARY_SOFT,
    padding: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_VARIANT,
  },
  txtInput: {
    color: COLORS.TEXT_MUTED,
    fontWeight: "bold",
    fontSize: 12,
  },
});
