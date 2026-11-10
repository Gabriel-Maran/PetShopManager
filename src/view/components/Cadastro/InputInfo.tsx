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
import { FONT_SIZE, RADIUS, SPACING } from "../../Themes/tokens";

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
  // O campo não conhece o formato do que recebe: máscaras de valor, horário ou telefone ficam no
  // setItem de quem usa.
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
        onChangeText={setItem}
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
      fontSize: FONT_SIZE.SUBTITLE,
      borderWidth: 1.5,
      borderRadius: RADIUS[10],
      paddingHorizontal: SPACING[15],
      paddingVertical: SPACING[5],
      borderColor: colors.BORDER_STRONG,
    },
  });
