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
}: {
  image: ImageSourcePropType;
  item: string;
  setItem: (item: any) => void;
  placeHolder: string;
  titleName: string;
}) {
  return (
    <View style={styles.ctnInput}>
      <View style={styles.ctnImgInut}>
        <Image style={styles.imgInput} source={image} />
      </View>
      <View style={{ width: "90%" }}>
        <Text style={styles.txtInput}>{titleName}</Text>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  imgInput: {
    width: 30,
    height: 30,
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
  txtInput: {},
});
