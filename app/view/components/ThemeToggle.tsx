import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import DefaultHeader from "./Header/DefaultHeader";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../Themes/ThemeProvider";
import { useRef, useState } from "react";

const THUMB_SIZE = 40;
const SWITCH_WIDTH = 140;
const PADDING = 14;
const WRAPPER_PADDING = 6;

const THUMB_OFF = PADDING - WRAPPER_PADDING;
const THUMB_ON = SWITCH_WIDTH - THUMB_SIZE - PADDING - WRAPPER_PADDING;

export default function ThemeToggle() {
  const { colors, isDark, trocarTheme } = useTheme();
  const s = useThemedStyles(styles);

  const animatedValue = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [currentImage, setCurrentImage] = useState(
    isDark
      ? require("../../assets/color_modes/moon.png")
      : require("../../assets/color_modes/sun.png"),
  );

  const toggleSwitch = () => {
    const nextIsDark = !isDark;

    // Animação do trilho
    Animated.timing(animatedValue, {
      toValue: nextIsDark ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    // Fade out → troca imagem → Fade in
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setCurrentImage(
        nextIsDark
          ? require("../../assets/color_modes/moon.png")
          : require("../../assets/color_modes/sun.png"),
      );
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }).start();
    });

    trocarTheme();
  };

  const moveThumb = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [THUMB_OFF, THUMB_ON],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#4CC9F0", "#03045E"],
  });

  return (
    <TouchableOpacity onPress={toggleSwitch} activeOpacity={0.85}>
      <Animated.View style={[s.track, { backgroundColor }]}>
        <Animated.View
          style={[s.thumbWrapper, { transform: [{ translateX: moveThumb }] }]}
        >
          <Animated.Image
            source={currentImage}
            style={[s.thumb, { opacity: fadeAnim }]}
          />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    track: {
      width: SWITCH_WIDTH,
      height: THUMB_SIZE + PADDING * 2,
      borderRadius: 99,
    },
    thumbWrapper: {
      position: "absolute",
      top: PADDING - WRAPPER_PADDING,
      backgroundColor: "rgba(255,255,255,0.18)",
      borderRadius: 99,
      padding: WRAPPER_PADDING,
    },
    thumb: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: 99,
    },
  });
