import { StyleSheet, Text, View } from "react-native";
import { useCallback, useState } from "react";
import ButtonBack from "./Botões/ButtonBack";
import { ThemeColors, useThemedStyles } from "../../Themes/ThemeProvider";
import { useScreen } from "../../../hooks/useScreen";
import { useBackGuard } from "../../../hooks/useBackNavigation";
import { DIALOGS } from "../../../globals/messages";
import ConfirmModal from "../ConfirmModal";

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
  const { requestBack, goBack } = useScreen();
  const openConfirm = useCallback(() => setIsConfirmOpen(true), []);

  // A guarda vale para o botão da tela e para o do Android, que pedem a mesma confirmação.
  useBackGuard(hasUnsavedChanges ? openConfirm : null);

  return (
    <>
      <View style={s.container}>
        <ButtonBack onPress={requestBack} />

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
      padding: 20,
      alignItems: "center",
      gap: 15,
    },
    txtTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.TEXT_PRIMARY,
    },
    txtSubTitle: {
      fontSize: 14,
      color: colors.TEXT_MUTED,
    },
  });
