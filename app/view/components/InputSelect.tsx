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
import { ThemeColors, useThemedStyles } from "../Themes/ThemeProvider";
import InputWrapper from "./Cadastro/InputWrapper"; 

interface InputSelectProps<T> {
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

  const handleSelect = (item: T) => {
    onChange(item);
    setIsOpen(false);
  };

  return (
    <InputWrapper
      image={image}
      titleName={titleName}
      hasBorderBottom={hasBorderBottom}
    >
      <TouchableOpacity
        style={s.selectBox}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Text style={s.selectText}>
          {itemSelected ? labelExtractor(itemSelected) : placeholder}
        </Text>
        <Image
          style={s.arrow}
          source={
            isOpen
              ? require("../../assets/setas/closeGreen.png")
              : require("../../assets/setas/openGreen.png")
          }
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={s.dropdown}>
          <FlatList
            data={itens}
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={s.listItem}
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
      borderWidth: 1,
      borderColor: colors.BORDER_LIGHT,
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 10,
      backgroundColor: colors.BACKGROUND,
    },
    selectText: {
      fontSize: 16,
      color: colors.TEXT_PRIMARY,
    },
    arrow: {
      width: 14,
      height: 14,
      tintColor: colors.PRIMARY_VARIANT,
    },
    dropdown: {
      marginTop: 5,
      borderWidth: 1,
      borderColor: colors.BORDER_LIGHT,
      borderRadius: 8,
      backgroundColor: colors.BACKGROUND,
      overflow: "hidden",
    },
    listItem: {
      borderBottomWidth: 1,
      borderBottomColor: colors.BORDER_LIGHT,
    },
  });