import React, { useRef } from "react";
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Text,
  ImageSourcePropType,
} from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../../Themes/ThemeProvider";
import InputWrapper from "../InputWrapper";
import { A11Y_LABELS } from "../../../../globals/accessibilityLabels";
import {
  HIDDEN_FROM_SCREEN_READER,
  touchTargetSlop,
} from "../../Acessibilidade/accessibilityProps";

const SWITCH_WIDTH = 50;
const SWITCH_HEIGHT = 30;

export default function Toggle({
  hasBorderBottom = false,
  image,
  title,
  subtitle,
  onChange,
  value,
  noEdit = false,
}: {
  hasBorderBottom?: boolean;
  image: ImageSourcePropType;
  title: string;
  subtitle?: string;
  onChange?: (value: number) => void;
  value: number;
  noEdit?: boolean;
}) {
  const { colors } = useTheme(); // ← para as cores animadas (interpolate)
  const s = useThemedStyles(styles);

  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  const toggleSwitch = () => {
    const newValue = !value;
    onChange?.(newValue ? 1 : 0); // onChange era opcional mas chamado sem verificar

    Animated.timing(animatedValue, {
      toValue: newValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const moveThumb = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  // cores animadas precisam vir do useTheme diretamente (não do StyleSheet)
  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.DESATIVADO, colors.PRIMARY],
  });

  return (
    <InputWrapper
      image={image}
      titleName={title}
      hasBorderBottom={hasBorderBottom}
    >
      <View style={s.toggleESubtitle}>
        {/* A pergunta já vai no nome do interruptor; escondida aqui, o leitor não a repete. */}
        {subtitle && (
          <Text style={s.subtitle} {...HIDDEN_FROM_SCREEN_READER}>
            {subtitle}
          </Text>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={!noEdit ? toggleSwitch : undefined}
          disabled={noEdit}
          accessibilityRole="switch"
          accessibilityLabel={A11Y_LABELS.toggle(title, subtitle)}
          accessibilityState={{ checked: Boolean(value) }}
          hitSlop={touchTargetSlop({
            width: SWITCH_WIDTH,
            height: SWITCH_HEIGHT,
          })}
        >
          <Animated.View style={[s.switchContainer, { backgroundColor }]}>
            <Animated.View
              style={[s.thumb, { transform: [{ translateX: moveThumb }] }]}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </InputWrapper>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    toggleESubtitle: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1.5,
      borderColor: colors.BORDER_STRONG,
      padding: 10,
      paddingLeft: 15,
      borderRadius: 10,
    },
    toggleESubtitleNoEdit: {
      width: "90%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 15,
    },
    subtitle: {
      fontSize: 15,
      color: colors.TEXT_SECONDARY,
    },
    switchContainer: {
      width: SWITCH_WIDTH,
      height: SWITCH_HEIGHT,
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
    },
    txtInput: {
      color: colors.TEXT_MUTED,
      fontWeight: "bold",
      fontSize: 12,
    },
  });
