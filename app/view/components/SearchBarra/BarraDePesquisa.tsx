import { useEffect, useState } from "react";
import {
  Image,
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

export default function BarraDePesquisa({
  placeHolderStr,
  setSearch,
}: {
  placeHolderStr: string;
  setSearch: (txt: string) => void;
}) {
  const [text, setText] = useState("");
  useEffect(() => {
    setSearch(text);
  }, [text]);
  return (
    <View style={styles.container}>
      <View style={styles.pesquisa}>
        <TouchableOpacity style={styles.btnImg}>
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
    backgroundColor: "#F1F5F9",
    padding: 5,
    borderRadius: 10,
  },
  input: {
    width: "80%",
    minHeight: 30,
    maxHeight: 100,
    fontSize: 16,
  },
  btnImg: {
    paddingHorizontal: 10,
  },
  img: {
    width: 30,
    height: 30,
  },
});
