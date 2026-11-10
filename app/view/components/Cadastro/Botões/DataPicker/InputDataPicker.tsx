import { ImageSourcePropType, TextInput, StyleSheet } from "react-native";
import { DatePicker } from "./DatePicker";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../../../Themes/ThemeProvider";
import InputWrapper from "../../InputWrapper";
import { todayIso } from "../../../../../utils/datas";

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
  item: string | null | undefined;
  setItem: (item: any) => void;
  titleName: string;
  hasBorderBottom?: boolean;
}) {
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
        accessibilityName={titleName}
        value={item ?? todayIso()}
        onChange={setItem}
        minDate="2024-01-01"
      />
    </InputWrapper>
  );
}
