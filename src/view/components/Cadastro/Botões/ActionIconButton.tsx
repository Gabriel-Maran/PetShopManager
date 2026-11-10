import {
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { ThemeColors, useTheme } from "../../../Themes/ThemeProvider";
import IconButton from "../../Acessibilidade/IconButton";
import { RADIUS, SPACING } from "../../../Themes/tokens";

const ICON_SIZE = 28;
const PADDING = SPACING[8];
const BORDER_WIDTH = 1;
/** Tamanho do botão na tela: o ícone, o espaço em volta e a borda dos dois lados. */
const BUTTON_SIZE = ICON_SIZE + 2 * (PADDING + BORDER_WIDTH);

export type ActionVariant = "edit" | "editField" | "deactivate" | "activate";

type Tone = { background: string; border: string; icon?: string };

function toneOf(colors: ThemeColors, variant: ActionVariant): Tone {
  switch (variant) {
    case "edit":
      return {
        background: colors.EDITAR_BACKGROUND_COLOR,
        border: colors.EDITAR_BORDER_COLOR,
      };
    case "editField":
      return {
        background: colors.EDITAR_CAMPO_BACKGROUND_COLOR,
        border: colors.EDITAR_CAMPO_BORDER_COLOR,
      };
    case "deactivate":
      return {
        background: colors.EXCLUIR_BACKGROUND_COLOR,
        border: colors.EXCLUIR_BORDER_COLOR,
      };
    case "activate":
      return {
        background: colors.REATIVAR_BACKGROUND_COLOR,
        border: colors.REATIVAR_BORDER_COLOR,
        icon: colors.REATIVAR_MAIN_COLOR,
      };
  }
}

/** Botão de ação das listas e campos (editar, desativar, reativar), com nome para o leitor de tela. */
export default function ActionIconButton({
  label,
  icon,
  variant,
  onPress,
  style,
}: {
  label: string;
  icon: ImageSourcePropType;
  variant: ActionVariant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const tone = toneOf(colors, variant);

  return (
    <IconButton
      label={label}
      width={BUTTON_SIZE}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: tone.background, borderColor: tone.border },
        style,
      ]}
    >
      <Image
        style={[styles.icon, tone.icon ? { tintColor: tone.icon } : null]}
        source={icon}
      />
    </IconButton>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: PADDING,
    borderRadius: RADIUS[15],
    borderWidth: BORDER_WIDTH,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
});
