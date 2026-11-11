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
} from "../../theme/ThemeProvider";
import InputWrapper from "./InputWrapper";
import { FONT_SIZE, RADIUS, SPACING } from "../../theme/tokens";

export default function InputInfo({
  image,
  item,
  setItem,
  placeholder,
  titleName,
  hasBorderBottom = false,
  isMultiline,
  isTypeable,
  inputKeyboardType,
  maxChars,
}: {
  image: ImageSourcePropType;
  item: string | null;
  setItem: (item: any) => void;
  placeholder: string;
  titleName: string;
  hasBorderBottom?: boolean;
  isMultiline: boolean;
  isTypeable?: boolean;
  inputKeyboardType?: KeyboardTypeOptions;
  maxChars: number;
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
        placeholder={placeholder}
        placeholderTextColor={colors.TEXT_PLACEHOLDER}
        onChangeText={setItem}
        value={item ?? undefined}
        multiline={isMultiline}
        editable={isTypeable}
        keyboardType={inputKeyboardType}
        maxLength={maxChars}
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
