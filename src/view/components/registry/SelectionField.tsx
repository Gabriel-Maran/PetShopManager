import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ImageSourcePropType,
} from "react-native";
import { Screen } from "../../../config/consts";
import EditButton from "./buttons/EditButton";
import { ThemeColors, useThemedStyles } from "../../theme/ThemeProvider";
import InputWrapper from "./InputWrapper";
import { A11Y_LABELS } from "../../../globals/accessibilityLabels";
import { touchTargetSlop } from "../accessibility/accessibilityProps";
import {
  FONT_SIZE,
  FONT_WEIGHT,
  LINE_HEIGHTS,
  RADIUS,
  SPACING,
} from "../../theme/tokens";

/** Altura fixa da linha de "Cadastrar nova raça", para a área de toque chegar a 48 dp. */
const NEW_BREED_LINE_HEIGHT = LINE_HEIGHTS[20];

export default function SelectionField({
  isEditable = true,
  image,
  titleName,
  selectedRecord,
  buttonText,
  hasBorderBottom,
  onPress,
  goEdit,
  canRegister = false,
  onRegister,
}: {
  isEditable: boolean;
  image: ImageSourcePropType;
  titleName: string;
  selectedRecord?: string;
  buttonText: string;
  hasBorderBottom: boolean;
  onPress: () => void;
  onClear?: () => void;
  goEdit: boolean;
  canRegister?: boolean;
  onRegister?: () => void;
}) {
  const s = useThemedStyles(styles);

  return (
    <InputWrapper
      image={image}
      titleName={titleName}
      hasBorderBottom={hasBorderBottom}
    >
      {selectedRecord ? (
        <View style={s.selectedRecordBox}>
          <View
            style={[
              s.recordBox,
              isEditable ? { marginRight: SPACING[10] } : {},
            ]}
          >
            <Text style={s.txtRecord} numberOfLines={1}>
              {selectedRecord}
            </Text>
          </View>
          {isEditable && (
            <EditButton
              label={A11Y_LABELS.changeSelection(titleName)}
              navigateTo={Screen.Registry}
              goEdit={goEdit}
              setModal={onPress}
              editField={true}
            />
          )}
        </View>
      ) : (
        isEditable && (
          <View style={s.actionsContainer}>
            <TouchableOpacity
              style={s.btnSave}
              onPress={onPress}
              accessibilityRole="button"
            >
              <Text style={s.txtSave}>{buttonText}</Text>
            </TouchableOpacity>
          </View>
        )
      )}
      {canRegister && onRegister && (
        <TouchableOpacity
          style={s.btnRegistryLabel}
          onPress={onRegister}
          accessibilityRole="button"
          accessibilityLabel={A11Y_LABELS.registry.newBreed}
          hitSlop={touchTargetSlop({ height: NEW_BREED_LINE_HEIGHT })}
        >
          <Text style={s.txtRegistryLabel}>+ Cadastrar nova raça</Text>
        </TouchableOpacity>
      )}
    </InputWrapper>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    selectedRecordBox: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    recordBox: {
      borderWidth: 1.5,
      flex: 1,
      paddingHorizontal: SPACING[15],
      paddingVertical: SPACING[12],
      borderRadius: RADIUS[10],
      fontSize: FONT_SIZE.TITLE,
      minHeight: 45,
      borderColor: colors.BORDER_STRONG,
    },
    txtRecord: {
      fontSize: FONT_SIZE.BODY_LARGE,
      color: colors.TEXT_PRIMARY,
    },
    actionsContainer: {
      width: "100%",
      // Espaçamento vertical automático entre o botão e o rótulo
      gap: SPACING[8],
    },
    btnSave: {
      width: "100%",
      height: 50,
      backgroundColor: colors.PRIMARY_VARIANT,
      borderRadius: RADIUS[15],
      display: "flex",
      justifyContent: "center",
    },
    txtSave: {
      color: colors.BACKGROUND,
      textAlign: "center",
      fontSize: FONT_SIZE.BODY_LARGE,
    },
    btnRegistryLabel: {
      alignSelf: "flex-start", // Não deixa o botão ocupar a largura inteira
    },
    txtRegistryLabel: {
      color: colors.TEXT_PRIMARY,
      fontSize: FONT_SIZE.BODY,
      lineHeight: NEW_BREED_LINE_HEIGHT,
      fontWeight: FONT_WEIGHT.MEDIUM,
    },
  });
