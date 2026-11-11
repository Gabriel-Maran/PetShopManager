import { StyleSheet, Text, View } from "react-native";
import { useCallback, useState } from "react";
import BackButton from "./buttons/BackButton";
import { ThemeColors, useThemedStyles } from "../../theme/ThemeProvider";
import { useScreen } from "../../../hooks/useScreen";
import { useBackGuard } from "../../../hooks/useBackNavigation";
import { DIALOGS } from "../../../globals/messages";
import ConfirmModal from "../ConfirmModal";
import { FONT_SIZE, FONT_WEIGHT, SPACING } from "../../theme/tokens";

/** O título das telas internas, com o voltar. Para onde ele leva fica em config/navigation.ts. */
export default function TitleBar({
  hasUnsavedChanges = false,
  title,
  subtitle,
  isViewing,
}: {
  /** Com o formulário mudado, o voltar pede confirmação antes de sair; sem mudança, sai direto. */
  hasUnsavedChanges?: boolean;
  title: string;
  subtitle: string;
  isViewing?: boolean;
}) {
  const s = useThemedStyles(styles);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { goBack } = useScreen();
  const openConfirm = useCallback(() => setIsConfirmOpen(true), []);

  // O botão da tela e o do Android pedem a mesma confirmação.
  useBackGuard(hasUnsavedChanges ? openConfirm : null);

  return (
    <>
      <View style={s.container}>
        <BackButton onPress={hasUnsavedChanges ? openConfirm : goBack} />

        <View>
          <Text style={s.txtTitle} accessibilityRole="header">
            {title}
          </Text>
          {!isViewing && <Text style={s.txtSubTitle}>{subtitle}</Text>}
        </View>
      </View>
      <ConfirmModal
        visible={isConfirmOpen}
        emoji="⚠️"
        title={DIALOGS.leaveForm.title}
        message={DIALOGS.leaveForm.message}
        confirmLabel={DIALOGS.leaveForm.confirmLabel}
        variant="destructive"
        onConfirm={goBack}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
}
const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.THIRD_BACKGROUND,
      flexDirection: "row",
      borderWidth: 1,
      borderColor: colors.BORDER_MID,
      padding: SPACING[20],
      alignItems: "center",
      gap: SPACING[15],
    },
    txtTitle: {
      fontSize: FONT_SIZE.TITLE,
      fontWeight: FONT_WEIGHT.BOLD,
      color: colors.TEXT_PRIMARY,
    },
    txtSubTitle: {
      fontSize: FONT_SIZE.BODY,
      color: colors.TEXT_MUTED,
    },
  });
