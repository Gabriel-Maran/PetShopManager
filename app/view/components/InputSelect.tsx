import { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function InputSelect() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View
      style={{
        alignSelf: "center",
        width: "70%",
        backgroundColor: "#ffffff",
        borderRadius: 6,
        borderWidth: 2,
        borderColor: "#8ea8ac",
      }}
    >
      <TouchableOpacity
        style={{ flexDirection: "row", alignItems: "center", paddingLeft: 10 }}
        onPress={(isOpen) => {
          setIsOpen(!isOpen);
        }}
      >
        <Text style={{ flex: 1, color: "rgb(0, 0, 0)" }}>
          Clique e selecione
        </Text>
        <Image
          source={
            isOpen
              ? require("../../assets/closeGreen.png")
              : require("../../assets/openGreen.png")
          }
        />
      </TouchableOpacity>
      {}
    </View>
  );
}
