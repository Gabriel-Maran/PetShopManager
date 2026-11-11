import { ImageSourcePropType } from "react-native";
import { DatePicker } from "./DatePicker";
import InputWrapper from "../InputWrapper";
import { todayIso } from "../../../../utils/dates";

export default function DatePickerField({
  isEditable = true,
  image,
  item,
  setItem,
  titleName,
  hasBorderBottom = false,
}: {
  isEditable: boolean;
  image: ImageSourcePropType;
  item: string | null | undefined;
  setItem: (value: string) => void;
  titleName: string;
  hasBorderBottom?: boolean;
}) {
  return (
    <InputWrapper image={image} titleName={titleName} hasBorderBottom={hasBorderBottom}>
      <DatePicker
        isEditable={isEditable}
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
