import { useEffect, useState } from "react";
import {
  Image,
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";

export default function BarraDePesquisa({
  placeHolderStr,
  setSearch,
}: {
  placeHolderStr: string;
  setSearch: (txt: string) => void;
}) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  const [text, setText] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (text) {
        setSearch(text);
      }
    }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [text]);

  return (
    <View style={s.container}>
      <View style={s.pesquisa}>
        <TouchableOpacity onPress={() => setSearch(text)} style={s.btnImg}>
          <Image
            style={s.img}
            source={require("../../../assets/outros/search.png")}
          />
        </TouchableOpacity>
        <TextInput
          onChangeText={(txt: string) => {
            setText(txt);
            if (txt.trim() == "") {
              setSearch(txt);
            }
          }}
          value={text}
          placeholder={placeHolderStr}
          multiline={false}
          style={s.input}
          placeholderTextColor={colors.TEXT_PRIMARY}
        />
      </View>
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: "100%",
      marginTop: 10,
    },
    pesquisa: {
      flexDirection: "row",
      width: "90%",
      alignSelf: "center",
      alignItems: "center",
      backgroundColor: colors.THIRD_BACKGROUND,
      padding: 5,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.BORDER_STRONG,
    },
    input: {
      width: "80%",
      minHeight: 30,
      maxHeight: 100,
      fontSize: 16,
      color: colors.TEXT_PRIMARY,
    },
    btnImg: {
      paddingHorizontal: 10,
    },
    img: {
      width: 30,
      height: 30,
      tintColor: colors.TEXT_MUTED,
    },
  });
