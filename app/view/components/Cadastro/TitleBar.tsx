import { StyleSheet, Text, View } from "react-native";
import { useCallback, useState } from "react";
import ButtonBack from "./Botões/ButtonBack";
import { ThemeColors, useThemedStyles } from "../../Themes/ThemeProvider";
import { useScreen } from "../../../hooks/useScreen";
import { useBackGuard } from "../../../hooks/useBackNavigation";
import ConfirmModal from "../ConfirmModal";

/** O título das telas internas, com o voltar. Para onde ele leva fica em config/navigation.ts. */
export default function TitleBar({
  confirmReturn = false,
  title,
  subtitle,
  isViewing,
}: {
  /** Pede confirmação antes de sair, nos formulários em que o usuário pode perder o que digitou. */
  confirmReturn?: boolean;
  title: string;
  subtitle: string;
  isViewing?: boolean;
}) {
  const s = useThemedStyles(styles);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { requestBack, goBack } = useScreen();
  const openConfirm = useCallback(() => setIsConfirmOpen(true), []);

  // A guarda vale para o botão da tela e para o do Android, que pedem a mesma confirmação.
  useBackGuard(confirmReturn ? openConfirm : null);

  return (
    <>
      <View style={s.container}>
        <ButtonBack onPress={requestBack} />

        <View>
          <Text style={s.txtTitle}>{title}</Text>
          {!isViewing && <Text style={s.txtSubTitle}>{subtitle}</Text>}
        </View>
      </View>
      <ConfirmModal
        visible={isConfirmOpen}
        emoji="⚠️"
        title="Confirma voltar?"
        message="Você perderá todos os novos dados não salvos."
        confirmLabel="Voltar"
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
