import { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Text,
  ImageSourcePropType,
} from "react-native";
import { ThemeColors, useTheme, useThemedStyles } from "../../../theme/ThemeProvider";
import InputWrapper from "../InputWrapper";
import { A11Y_LABELS } from "../../../../globals/accessibilityLabels";
import { HIDDEN_FROM_SCREEN_READER, touchTargetSlop } from "../../accessibility/accessibilityProps";
import { FONT_SIZE, RADIUS, SPACING } from "../../../theme/tokens";

const SWITCH_WIDTH = 50;
const SWITCH_HEIGHT = 30;
const ANIMATION_DURATION_MS = 200;

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
  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  const animatedValue = useState(() => new Animated.Value(value ? 1 : 0))[0];

  // A animação segue o `value`, e não o toque: assim ela acompanha também o valor que muda por fora,
  // como o formulário que carrega um pet com a remarcação ligada.
  useEffect(() => {
    const animation = Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: ANIMATION_DURATION_MS,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [value, animatedValue]);

  const toggleSwitch = () => onChange?.(value ? 0 : 1);

  const moveThumb = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  // A cor animada sai do `interpolate`, por isso vem do useTheme, e não do StyleSheet.
  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.DISABLED, colors.PRIMARY],
  });

  return (
    <InputWrapper image={image} titleName={title} hasBorderBottom={hasBorderBottom}>
      <View style={s.toggleAndSubtitle}>
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
            <Animated.View style={[s.thumb, { transform: [{ translateX: moveThumb }] }]} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </InputWrapper>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    toggleAndSubtitle: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1.5,
      borderColor: colors.BORDER_STRONG,
      padding: SPACING[10],
      paddingLeft: SPACING[15],
      borderRadius: RADIUS[10],
    },
    subtitle: {
      fontSize: FONT_SIZE.BODY_LARGE,
      color: colors.TEXT_SECONDARY,
    },
    switchContainer: {
      width: SWITCH_WIDTH,
      height: SWITCH_HEIGHT,
      borderRadius: RADIUS[15],
      justifyContent: "center",
    },
    thumb: {
      width: 26,
      height: 26,
      borderRadius: RADIUS[13],
      backgroundColor: colors.TOGGLE_THUMB,
      elevation: 3,
      shadowColor: colors.SHADOW,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
  });
