import { ReactNode } from "react";
import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  StyleSheet,
} from "react-native";
import {
  useTheme,
  useThemedStyles,
  ThemeColors,
} from "../../theme/ThemeProvider";
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from "../../theme/tokens";

interface InputWrapperProps {
  image: ImageSourcePropType;
  titleName: string;
  hasBorderBottom?: boolean;
  children: ReactNode;
  withGapComponents?: boolean;
  inputSelectIsOpen?: boolean;
}

export default function InputWrapper({
  image,
  titleName,
  hasBorderBottom = true,
  children,
  withGapComponents = true,
  inputSelectIsOpen,
}: InputWrapperProps) {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  return (
    <View
      style={[
        s.ctnInput,
        hasBorderBottom
          ? { borderBottomWidth: 1, borderColor: colors.BORDER_LIGHT }
          : {},
      ]}
    >
      <View
        style={[
          s.ctnImgInput,
          inputSelectIsOpen
            ? { alignSelf: "flex-start", marginTop: SPACING[12.1] }
            : { alignSelf: "center" },
        ]}
      >
        <Image style={s.imgInput} source={image} />
      </View>

      <View
        style={[
          s.rightContent,
          withGapComponents ? { gap: SPACING[5] } : { gap: 0 },
        ]}
      >
        {/* Em maiúsculas, o leitor poderia soletrar; o rótulo faz ele ler o nome do campo. */}
        <Text style={s.txtInput} accessibilityLabel={titleName}>
          {titleName.toUpperCase()}
        </Text>
        {children}
      </View>
    </View>
  );
}
const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    ctnInput: {
      width: "100%",
      padding: SPACING[15],
      flexDirection: "row",
      alignItems: "flex-start",
      gap: SPACING[10],
    },
    ctnImgInput: {
      backgroundColor: colors.PRIMARY_SOFT,
      padding: SPACING[8],
      borderRadius: RADIUS[15],
      borderWidth: 1,
      borderColor: colors.PRIMARY_VARIANT,
      marginTop: SPACING[2],
    },
    imgInput: {
      width: 28,
      height: 28,
      tintColor: colors.PRIMARY,
    },
    rightContent: {
      flex: 1,
    },
    txtInput: {
      color: colors.TEXT_MUTED,
      fontWeight: FONT_WEIGHT.BOLD,
      fontSize: FONT_SIZE.SMALL,
    },
  });
