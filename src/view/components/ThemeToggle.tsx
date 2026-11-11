import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemeColors, useTheme, useThemedStyles } from "../theme/ThemeProvider";
import { useState } from "react";
import { settingsController } from "../../controller/SettingsController";
import { ThemePreference } from "../../model/Settings";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { A11Y_LABELS } from "../../globals/accessibilityLabels";
import { RADIUS, SPACING } from "../theme/tokens";

const THUMB_SIZE = 40;
const SWITCH_WIDTH = 140;
const PADDING = SPACING[16];
const WRAPPER_PADDING = SPACING[6];

const THUMB_OFF = PADDING - WRAPPER_PADDING;
const THUMB_ON = SWITCH_WIDTH - THUMB_SIZE - PADDING - WRAPPER_PADDING;

export default function ThemeToggle() {
  const { isDark, setTheme } = useTheme();
  const s = useThemedStyles(styles);
  // Se a gravação falhar, o modal de erro avisa que o tema escolhido não ficou salvo para a próxima vez.
  const { run: saveTheme } = useAsyncAction((theme: ThemePreference) =>
    settingsController.saveTheme(theme),
  );

  const thumbAnim = useState(() => new Animated.Value(isDark ? 1 : 0))[0];
  const thumbFadeAnim = useState(() => new Animated.Value(1))[0];
  // 0 = afternoon (claro), 1 = night (escuro)
  const bgFadeAnim = useState(() => new Animated.Value(isDark ? 1 : 0))[0];

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

    const theme = nextIsDark ? ThemePreference.Dark : ThemePreference.Light;
    setTheme(theme);
    saveTheme(theme);
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
      onPress={toggleSwitch}
      activeOpacity={0.85}
      accessibilityRole="switch"
      accessibilityLabel={A11Y_LABELS.theme.darkMode}
      accessibilityState={{ checked: isDark }}
    >
      <View style={s.track}>
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
          style={[StyleSheet.absoluteFill, { opacity: bgFadeAnim }, { width: 180, height: 100 }]}
          resizeMode="cover"
        />

        {/* Thumb deslizante */}
        <Animated.View style={[s.thumbWrapper, { transform: [{ translateX: moveThumb }] }]}>
          <Animated.View style={[s.thumb, { opacity: thumbFadeAnim }]} />
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
      borderRadius: RADIUS.PILL,
      overflow: "hidden",
      backgroundColor: colors.THEME_TOGGLE_SKY,
    },
    thumbWrapper: {
      position: "absolute",
      top: PADDING - WRAPPER_PADDING,
      borderRadius: RADIUS.PILL,
      padding: WRAPPER_PADDING,
    },
    thumb: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: RADIUS.PILL,
      backgroundColor: colors.THEME_TOGGLE_THUMB,
    },
  });
