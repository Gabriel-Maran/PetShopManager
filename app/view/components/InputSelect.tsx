import { ReactNode, useState } from "react";
import {
  FlatList,
  Image,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface InputSelectProps<T> {
  itens: T[];
  itemSelected?: T | null;
  onChange: (item: T) => void;
  placeholder?: string;
  labelExtractor: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  listItemStyle?: StyleProp<ViewStyle>;
}

export default function InputSelect<T>({
  itens,
  itemSelected,
  onChange,
  placeholder = "Clique e selecione",
  labelExtractor,
  renderItem,
  containerStyle,
  buttonStyle,
  textStyle,
  listItemStyle,
}: InputSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (item: T) => {
    onChange(item);
    setIsOpen(false); // Fecha ao selecionar
  };

  return (
    <View style={containerStyle}>
      <TouchableOpacity style={buttonStyle} onPress={() => setIsOpen(!isOpen)}>
        <Text style={textStyle}>
          {itemSelected ? labelExtractor(itemSelected) : placeholder}
        </Text>
        <Image
          source={
            isOpen
              ? require("../../assets/closeGreen.png")
              : require("../../assets/openGreen.png")
          }
        />
      </TouchableOpacity>

      {isOpen && (
        <FlatList
          data={itens}
          scrollEnabled={false} // Evita conflitos de scroll se estiver dentro de uma ScrollView
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={listItemStyle}
              onPress={() => handleSelect(item)}
            >
              {renderItem(item, index)}
            </TouchableOpacity>
          )}
          keyExtractor={(_, index) => index.toString()}
        />
      )}
    </View>
  );
}
