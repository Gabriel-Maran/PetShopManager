import {
  ImageSourcePropType,
  TextInput,
  StyleSheet,
  KeyboardTypeOptions,
} from "react-native";
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
  tipoTeclado,
  maximoCaracteres,
}: {
  image: ImageSourcePropType;
  item: string | null;
  setItem: (item: any) => void;
  placeHolder: string;
  titleName: string;
  hasBorderBottom?: boolean;
  variasLinhas: boolean;
  digitavel?: boolean;
  tipoTeclado?: KeyboardTypeOptions;
  maximoCaracteres: number;
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
        placeholderTextColor={colors.TEXT_PLACEHOLDER}
        onChangeText={(item) => setItem(item)}
        value={item ?? undefined}
        multiline={variasLinhas}
        
        editable={digitavel}
        keyboardType={tipoTeclado}
        maxLength={maximoCaracteres}
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
      borderWidth: 1.5,
      borderRadius: 10,
      paddingHorizontal: 15,
      paddingVertical: 5,
      borderColor: colors.BORDER_STRONG,
    },
  });
