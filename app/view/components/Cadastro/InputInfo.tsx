import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";

export default function InputInfo({
  image,
  item,
  setItem,
  placeHolder,
  titleName,
  hasBorderBottom = false,
  variasLinhas,
  digitavel,
}: {
  image: ImageSourcePropType;
  item: string;
  setItem: (item: any) => void;
  placeHolder: string;
  titleName: string;
  hasBorderBottom?: boolean;
  variasLinhas: boolean;
  digitavel: boolean;
}) {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  return (
    <View
      style={[
        s.ctnInput,
        hasBorderBottom
          ? { borderBottomWidth: 1, borderColor: colors.BORDER_LIGHT }
          : { borderWidth: 0 },
      ]}
    >
      <View style={s.ctnImgInput}>
        <Image style={s.imgInput} source={image} />
      </View>
      <View style={{ width: "90%", gap: 5 }}>
        <Text style={s.txtInput}>{titleName.toUpperCase()}</Text>
        <TextInput
          style={s.input}
          placeholder={placeHolder}
          onChangeText={(item) => setItem(item)}
          value={item}
          multiline={variasLinhas}
          editable={digitavel}
          placeholderTextColor={colors.TEXT_PRIMARY}
        />
      </View>
    </View>
  );
}
const styles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      tintColor: colors.PRIMARY,
    },
    input: {
      color: colors.TEXT_PRIMARY,
      width: "90%",
      minHeight: 45,
      maxHeight: 90,
      fontSize: 16,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 5,
      borderColor: colors.BORDER_STRONG,
    },
    ctnImgInput: {
      backgroundColor: colors.PRIMARY_SOFT,
      padding: 8,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.PRIMARY_VARIANT,
    },
    txtInput: {
      color: colors.TEXT_MUTED,
      fontWeight: "bold",
      fontSize: 12,
    },
  });
