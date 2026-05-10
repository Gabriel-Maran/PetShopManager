import { ImageSourcePropType, TextInput, StyleSheet } from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";
import InputWrapper from "../../components/Cadastro/InputWrapper";

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
    <InputWrapper
      image={image}
      titleName={titleName}
      hasBorderBottom={hasBorderBottom}
    >
      <TextInput
        style={s.input}
        placeholder={placeHolder}
        onChangeText={(item) => setItem(item)}
        value={item}
        multiline={variasLinhas}
        editable={digitavel}
        placeholderTextColor={colors.TEXT_PRIMARY}
      />
    </InputWrapper>
  );
}
const styles = (colors: ThemeColors) =>
  StyleSheet.create({
     input: {
      color: colors.TEXT_PRIMARY,
      width: "100%",
      minHeight: 45,
      maxHeight: 90,
      fontSize: 16,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 5,
      borderColor: colors.BORDER_STRONG,
    },
  });
