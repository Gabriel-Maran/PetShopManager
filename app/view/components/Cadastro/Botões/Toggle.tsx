import React, { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Text,
  Image,
} from "react-native";

export default function Toggle({
  hasBorderBottom = false,
  image,
}: {
  hasBorderBottom?: boolean;
  image: ImageSourcePropType;
}) {
  const [isEnabled, setIsEnabled] = useState(false);
  const animatedValue = useRef(new Animated.Value(isEnabled ? 1 : 0)).current;

  const toggleSwitch = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);

    // Animação da "bolinha"
    Animated.timing(animatedValue, {
      toValue: newValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // false porque estamos animando cores e layout
    }).start();
  };

  // Interpolação para mover a bolinha
  const moveThumb = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22], // Ajuste conforme o tamanho do botão
  });

  // Interpolação para mudar a cor de fundo
  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ccc", "#4cd964"], // Cinza para Verde
  });

  return (
    <View
      style={[
        styles.ctnInput,
        hasBorderBottom
          ? { borderBottomWidth: 1, borderColor: "#EDEDED" }
          : { borderWidth: 0 },
      ]}
    >
      <View style={styles.ctnImgInput}>
        <Image style={styles.imgInput} source={image} />
      </View>
      <View style={styles.container}>
        <Text style={styles.label}>Entregar?</Text>

        <TouchableOpacity activeOpacity={0.8} onPress={toggleSwitch}>
          <Animated.View style={[styles.switchContainer, { backgroundColor }]}>
            <Animated.View
              style={[styles.thumb, { transform: [{ translateX: moveThumb }] }]}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ctnInput: {
    width: "100%",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ctnImgInput: {
    backgroundColor: "#E1F5EE",
    padding: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#1D9E75",
  },
  imgInput: {
    width: 28,
    height: 28,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    minWidth: 50,
  },
  switchContainer: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "white",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  }
});
