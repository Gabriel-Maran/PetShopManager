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
} from "../Themes/ThemeProvider";
import InputWrapper from "./Cadastro/InputWrapper";

interface InputSelectProps<T> {
  isEditavel: boolean;
  itens: T[];
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
  isEditavel = true,
  itens,
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

  return (
    <InputWrapper
      image={image}
      titleName={titleName}
      hasBorderBottom={hasBorderBottom}
      whitGapComponents={false}
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
        disabled={!isEditavel}
        activeOpacity={0.7}
      >
        <Text style={s.selectText}>
          {itemSelected ? labelExtractor(itemSelected) : placeholder}
        </Text>
        {isEditavel && (
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
            data={itens}
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[s.listItem]}
                onPress={() => handleSelect(item)}
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
      minHeight: 45,
      width: "100%",
      borderWidth: 1.5,
      borderColor: colors.BORDER_STRONG,
      borderRadius: 10,
      paddingHorizontal: 15,
      paddingVertical: 10,
      marginTop: 5,
    },
    selectText: {
      fontSize: 16,
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
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      backgroundColor: colors.BACKGROUND,
      overflow: "hidden",
    },
    listItem: {
      borderBottomWidth: 1,
      borderBottomColor: colors.BORDER_LIGHT,
    },
  });
