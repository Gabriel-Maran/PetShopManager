import { ReactNode } from "react";
import { View, Text, Image, ImageSourcePropType, StyleSheet} from "react-native";
import { useTheme, useThemedStyles,ThemeColors } from "../../Themes/ThemeProvider";


interface InputWrapperProps {
  image: ImageSourcePropType;
  titleName: string;
  hasBorderBottom?: boolean;
  children: ReactNode;
}

export default function InputWrapper({ image, titleName, hasBorderBottom = true, children }: InputWrapperProps) {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  return (
    <View style={[s.ctnInput, hasBorderBottom ? { borderBottomWidth: 1, borderColor: colors.BORDER_LIGHT } : {}]}>
      
      <View style={s.ctnImgInput}>
        <Image style={s.imgInput} source={image} />
      </View>

      <View style={s.rightContent}>
        <Text style={s.txtInput}>{titleName.toUpperCase()}</Text>
        {children}
        
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
    alignItems: "flex-start", 
    gap: 10,
  },
  ctnImgInput: {
    backgroundColor: colors.PRIMARY_SOFT,
    padding: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.PRIMARY_VARIANT,
    marginTop: 2, 
  },
  imgInput: {
    width: 28,
    height: 28,
    tintColor: colors.PRIMARY,
  },
  rightContent: {
    flex: 1,
    gap: 5,
  },
   txtInput: {
    color: colors.TEXT_MUTED,
    fontWeight: "bold",
    fontSize: 12,
  },
 });