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
import { StatusFiltro } from "../../../config/consts";
import FilterPanel from "./FilterPanel";
import { MAX_SEARCH_LENGTH } from "../../../globals/limits";

export default function BarraDePesquisa({
  placeHolderStr,
  setSearch,
  hasFilter = false,
  statusFiltro = "ativo",
  onStatusFiltroChange,
}: {
  placeHolderStr: string;
  setSearch: (txt: string) => void;
  hasFilter?: boolean;
  statusFiltro?: StatusFiltro;
  onStatusFiltroChange?: (n: number) => void;
}) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  const [text, setText] = useState("");
  const [isSelectedFilter, setIsSelectedFilter] = useState(false);

  useEffect(() => {
    if (!hasFilter) {
      setIsSelectedFilter(false);
    }
  }, [hasFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearch(text);
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [text]);

  return (
    <View style={s.container}>
      {hasFilter && isSelectedFilter ? (
        <FilterPanel
          value={statusFiltro}
          onChange={onStatusFiltroChange ?? (() => {})}
          onClose={() => setIsSelectedFilter(false)}
        />
      ) : (
        <View style={s.pesquisa}>
          <TouchableOpacity onPress={() => setSearch(text)} style={s.btnImg}>
            <Image
              style={s.img}
              source={require("../../../assets/outros/search.png")}
            />
          </TouchableOpacity>
          <TextInput
            onChangeText={setText}
            value={text}
            placeholder={placeHolderStr}
            maxLength={MAX_SEARCH_LENGTH}
            multiline={false}
            style={s.input}
            placeholderTextColor={colors.TEXT_PRIMARY}
          />
        </View>
      )}
      {hasFilter && (
        <TouchableOpacity
          onPress={() => setIsSelectedFilter(!isSelectedFilter)}
          style={s.btnFilter}
        >
          <Image
            style={s.imgFilter}
            source={require("../../../assets/outros/filter.png")}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: "100%",
      marginTop: 10,
      flexDirection: "row",
      paddingHorizontal: 16,
      gap: 5,
    },
    pesquisa: {
      flex: 1,
      flexDirection: "row",
      alignSelf: "center",
      alignItems: "center",
      backgroundColor: colors.THIRD_BACKGROUND,
      padding: 5,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.BORDER_STRONG,
    },
    input: {
      minHeight: 30,
      flex: 1,
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
    btnFilter: {
      backgroundColor: colors.FILTER_BACKGROUND,
      borderRadius: 99,
      alignContent: "center",
      justifyContent: "center",
      alignSelf: "center",
      padding: 10,
    },
    imgFilter: {
      tintColor: colors.FILTER_ICON,
      width: 36,
      height: 36,
    },
  });
