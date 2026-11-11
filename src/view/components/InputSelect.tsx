import { ReactNode, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageSourcePropType,
} from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../theme/ThemeProvider";
import InputWrapper from "./registry/InputWrapper";
import { A11Y_LABELS } from "../../globals/accessibilityLabels";
import { touchTargetSlop } from "./accessibility/accessibilityProps";
import { FONT_SIZE, RADIUS, SPACING } from "../theme/tokens";

const SELECT_MIN_HEIGHT = 45;

interface InputSelectProps<T> {
  isEditable: boolean;
  options: T[];
  itemSelected?: T | null;
  onChange: (item: T) => void;
  placeholder?: string;
  labelExtractor: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;

  titleName: string;
  image: ImageSourcePropType;
  hasBorderBottom?: boolean;
}

export default function InputSelect<T>({
  isEditable = true,
  options,
  itemSelected,
  onChange,
  placeholder = "Clique e selecione",
  labelExtractor,
  renderItem,
  titleName,
  image,
  hasBorderBottom = true,
}: InputSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const s = useThemedStyles(styles);
  const { colors } = useTheme();

  const handleSelect = (item: T) => {
    onChange(item);
    setIsOpen(false);
  };

  const selectedText = itemSelected ? labelExtractor(itemSelected) : placeholder;

  return (
    <InputWrapper
      image={image}
      titleName={titleName}
      hasBorderBottom={hasBorderBottom}
      withGapComponents={false}
      inputSelectIsOpen={isOpen}
    >
      <TouchableOpacity
        style={[
          s.selectBox,
          isOpen
            ? {
                borderBottomRightRadius: 0,
                borderBottomLeftRadius: 0,
                borderBottomColor: colors.BORDER_LIGHT,
              }
            : {},
        ]}
        onPress={() => {
          setIsOpen(!isOpen);
        }}
        disabled={!isEditable}
        activeOpacity={0.7}
        accessibilityRole="combobox"
        accessibilityLabel={A11Y_LABELS.field(titleName, selectedText)}
        accessibilityState={{ expanded: isOpen }}
        hitSlop={touchTargetSlop({ height: SELECT_MIN_HEIGHT })}
      >
        <Text style={s.selectText}>{selectedText}</Text>
        {isEditable && (
          <Image
            style={s.arrow}
            source={
              isOpen
                ? require("../../assets/setas/closeGreen.png")
                : require("../../assets/setas/openGreen.png")
            }
          />
        )}
      </TouchableOpacity>

      {isOpen && (
        <View style={s.dropdown}>
          <FlatList
            data={options}
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[s.listItem]}
                onPress={() => handleSelect(item)}
                accessibilityRole="button"
              >
                {renderItem(item, index)}
              </TouchableOpacity>
            )}
            keyExtractor={(_, index) => index.toString()}
          />
        </View>
      )}
    </InputWrapper>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    selectBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: SELECT_MIN_HEIGHT,
      width: "100%",
      borderWidth: 1.5,
      borderColor: colors.BORDER_STRONG,
      borderRadius: RADIUS[10],
      paddingHorizontal: SPACING[15],
      paddingVertical: SPACING[10],
      marginTop: SPACING[5],
    },
    selectText: {
      fontSize: FONT_SIZE.SUBTITLE,
      color: colors.TEXT_PRIMARY,
    },
    arrow: {
      width: 25,
      height: 25,
      tintColor: colors.PRIMARY_VARIANT,
    },
    dropdown: {
      width: "100%",
      borderWidth: 1,
      borderColor: colors.BORDER_LIGHT,
      borderBottomLeftRadius: RADIUS[8],
      borderBottomRightRadius: RADIUS[8],
      backgroundColor: colors.BACKGROUND,
      overflow: "hidden",
    },
    listItem: {
      borderBottomWidth: 1,
      borderBottomColor: colors.BORDER_LIGHT,
    },
  });
