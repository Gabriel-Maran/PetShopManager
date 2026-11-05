import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../Themes/ThemeProvider";
import { useRef } from "react";
import { configsController } from "../../controller/ConfigsController";

const THUMB_SIZE = 40;
const SWITCH_WIDTH = 140;
const PADDING = 16;
const WRAPPER_PADDING = 6;

const THUMB_OFF = PADDING - WRAPPER_PADDING;
const THUMB_ON = SWITCH_WIDTH - THUMB_SIZE - PADDING - WRAPPER_PADDING;

export default function ThemeToggle() {
  const { isDark, trocarTheme } = useTheme();
  const s = useThemedStyles(styles);

  const thumbAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const thumbFadeAnim = useRef(new Animated.Value(1)).current;
  // 0 = afternoon (claro), 1 = night (escuro)
  const bgFadeAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  const toggleSwitch = () => {
    const nextIsDark = !isDark;

    // Desliza o thumb
    Animated.timing(thumbAnim, {
      toValue: nextIsDark ? 1 : 0,
      duration: 350,
      useNativeDriver: false,
    }).start();

    // Crossfade do background: afternoon ↔ night
    Animated.timing(bgFadeAnim, {
      toValue: nextIsDark ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();

    // Fade out → Fade in do ícone do thumb
    Animated.timing(thumbFadeAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(thumbFadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });

    trocarTheme();
  };

  const moveThumb = thumbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [THUMB_OFF, THUMB_ON],
  });

  // afternoon some quando vai para night
  const afternoonOpacity = bgFadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <TouchableOpacity
      onPress={async () => {
        toggleSwitch();
        await configsController.updateConfig(1, isDark ? 0 : 1);
      }}
      activeOpacity={0.85}
    >
      <View
        style={[
          s.track,
          isDark
            ? { backgroundColor: "#03045E" }
            : { backgroundColor: "#4CC9F0" },
        ]}
      >
        {/* Background: afternoon (claro) */}
        <Animated.Image
          source={require("../../assets/color_modes/afternoon.png")}
          style={[
            StyleSheet.absoluteFill,
            { opacity: afternoonOpacity },
            { width: 250, height: 100 },
          ]}
          resizeMode="cover"
        />

        {/* Background: night (escuro) */}
        <Animated.Image
          source={require("../../assets/color_modes/night.png")}
          style={[
            StyleSheet.absoluteFill,
            { opacity: bgFadeAnim },
            { width: 180, height: 100 },
          ]}
          resizeMode="cover"
        />

        {/* Thumb deslizante */}
        <Animated.View
          style={[s.thumbWrapper, { transform: [{ translateX: moveThumb }] }]}
        >
          <Animated.View
            style={[
              s.thumb,
              { opacity: thumbFadeAnim },
              isDark
                ? { backgroundColor: "#DEDEDA" } // lua
                : { backgroundColor: "#FFDF22" }, // sol
            ]}
          />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    track: {
      width: SWITCH_WIDTH,
      height: THUMB_SIZE + PADDING * 2,
      borderRadius: 99,
      overflow: "hidden",
    },
    thumbWrapper: {
      position: "absolute",
      top: PADDING - WRAPPER_PADDING,
      borderRadius: 99,
      padding: WRAPPER_PADDING,
    },
    thumb: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: 99,
    },
  });
