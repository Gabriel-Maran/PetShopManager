import { ImageSourcePropType, TextInput, StyleSheet } from "react-native";
import { DatePicker } from "./DatePicker";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../../../Themes/ThemeProvider";
import InputWrapper from "../../InputWrapper";
import { hoje } from "../../../../../utils/dataPicker/dataPickerAux";

export default function InputDataPicker({
  isEditavel = true,
  image,
  item,
  setItem,
  titleName,
  hasBorderBottom = false,
}: {
  isEditavel: boolean;
  image: ImageSourcePropType;
  item: string | null;
  setItem: (item: any) => void;
  titleName: string;
  hasBorderBottom?: boolean;
}) {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  return (
    <InputWrapper
      image={image}
      titleName={titleName}
      hasBorderBottom={hasBorderBottom}
    >
      <DatePicker
        isEditavel={isEditavel}
        withIcon={false}
        label=""
        value={item ?? hoje()}
        onChange={setItem}
        minDate="2024-01-01"
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
