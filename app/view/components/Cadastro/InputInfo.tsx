import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function InputInfo({
  image,
  item,
  setItem,
  placeHolder,
  titleName,
  hasBorderBottom = false,
}: {
  image: ImageSourcePropType;
  item: string;
  setItem: (item: any) => void;
  placeHolder: string;
  titleName: string;
  hasBorderBottom?: boolean;
}) {
  return (
    <View
      style={[
        styles.ctnInput,
        hasBorderBottom
          ? { borderBottomWidth: 1, borderColor: "#EDEDED" }
          : { borderWidth: 0 },
      ]}
    >
      <View style={styles.ctnImgInut}>
        <Image style={styles.imgInput} source={image} />
      </View>
      <View style={{ width: "90%", gap: 5 }}>
        <Text style={styles.txtInput}>{titleName.toUpperCase()}</Text>
        <TextInput
          style={styles.input}
          placeholder={placeHolder}
          onChangeText={(item) => setItem(item)}
          value={item}
          multiline={true}
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
  },
  input: {
    width: "90%",
    minHeight: 45,
    maxHeight: 90,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  ctnImgInut: {
    backgroundColor: "#E1F5EE",
    padding: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#1D9E75",
  },
  txtInput: {
    color: "#A7A7A7",
    fontWeight: "bold",
    fontSize: 12,
  },
});
