import React, { useRef } from "react";
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Text,
  Image,
  ImageSourcePropType,
} from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../../Themes/ThemeProvider";

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
  subtitle: string;
  onChange?: (value: number) => void;
  value: number;
  noEdit?: boolean;
}) {
  const { colors } = useTheme(); // ← para as cores animadas (interpolate)
  const s = useThemedStyles(styles);

  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  const toggleSwitch = () => {
    const newValue = !value;
    onChange?.(newValue ? 1 : 0); // ✅ onChange era opcional mas chamado sem verificar

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

  // ✅ cores animadas precisam vir do useTheme diretamente (não do StyleSheet)
  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.DESATIVADO, colors.PRIMARY],
  });

  return (
    <View
      style={[
        s.ctnInput,
        hasBorderBottom && { borderBottomWidth: 1, borderColor: colors.BORDER },
      ]}
    >
      <View style={s.ctnImgInput}>
        <Image style={s.imgInput} source={image} />
      </View>

      <View style={s.container}>
        {title && <Text style={s.txtInput}>{title.trim().toUpperCase()}</Text>}

        <View style={!noEdit ? s.toggleESubtitle : s.toggleESubtitleNoEdit}>
          <Text style={s.subtitle}>{subtitle}</Text>

          <TouchableOpacity activeOpacity={0.8} onPress={toggleSwitch}>
            <Animated.View style={[s.switchContainer, { backgroundColor }]}>
              <Animated.View
                style={[s.thumb, { transform: [{ translateX: moveThumb }] }]}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    ctnInput: {
      width: "100%",
      padding: 15,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    ctnImgInput: {
      backgroundColor: colors.PRIMARY_SOFT,
      padding: 8,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.PRIMARY_VARIANT,
    },
    imgInput: {
      width: 28,
      height: 28,
      tintColor: colors.PRIMARY,
    },
    container: {
      gap: 5,
    },
    toggleESubtitle: {
      width: "90%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1.3,
      borderColor: colors.BORDER_MID,
      padding: 10,
      paddingLeft: 15,
      borderRadius: 10,
    },
    toggleESubtitleNoEdit: {
      width: "90%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 10,
      paddingLeft: 15,
    },
    subtitle: {
      fontSize: 15,
      color: colors.TEXT_SECONDARY,
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
    },
    txtInput: {
      color: colors.TEXT_MUTED,
      fontWeight: "bold",
      fontSize: 12,
    },
  });
