import { useEffect, useState } from "react";
import {
  Image,
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { COLORS } from "../../../config/consts";

export default function BarraDePesquisa({
  placeHolderStr,
  setSearch,
}: {
  placeHolderStr: string;
  setSearch: (txt: string) => void;
}) {
  const [text, setText] = useState("");

  return (
    <View style={styles.container}>
      <View style={styles.pesquisa}>
        <TouchableOpacity onPress={() => setSearch(text)} style={styles.btnImg}>
          <Image
            style={styles.img}
            source={require("../../../assets/outros/search.png")}
          />
        </TouchableOpacity>
        <TextInput
          onChangeText={(txt: string) => setText(txt)}
          value={text}
          placeholder={placeHolderStr}
          multiline={true}
          style={styles.input}
          placeholderTextColor={COLORS.TEXT_PRIMARY}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 10,
  },
  pesquisa: {
    flexDirection: "row",
    width: "90%",
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: COLORS.THIRD_BACKGROUND,
    padding: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER_STRONG,
  },
  input: {
    width: "80%",
    minHeight: 30,
    maxHeight: 100,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  btnImg: {
    paddingHorizontal: 10,
  },
  img: {
    width: 30,
    height: 30,
    tintColor: COLORS.TEXT_MUTED,
  },
});
