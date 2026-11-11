import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { exportDatabase, importDatabase } from "../../service/BackupService";
import { ThemeColors, useTheme, useThemedStyles } from "../theme/ThemeProvider";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import ConfirmModal from "./ConfirmModal";
import { HIDDEN_FROM_SCREEN_READER } from "./accessibility/accessibilityProps";
import { DIALOGS } from "../../globals/messages";
import { A11Y_LABELS } from "../../globals/accessibilityLabels";
import { FONT_SIZE, FONT_WEIGHT, LINE_HEIGHTS, RADIUS, SPACING } from "../theme/tokens";

/** O modal aberto: um só por vez, e as duas ações só começam depois da confirmação. */
type PendingDialog = "export" | "import" | null;

interface DatabaseTransferProps {
  onImportSuccess?: () => void;
}

export function DatabaseTransfer({ onImportSuccess }: DatabaseTransferProps) {
  const [pendingDialog, setPendingDialog] = useState<PendingDialog>(null);

  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  const exportAction = useAsyncAction(exportDatabase);
  const importAction = useAsyncAction(async () => {
    if (await importDatabase()) onImportSuccess?.();
  });
  const loading = exportAction.isRunning || importAction.isRunning;

  const closeDialog = () => setPendingDialog(null);

  function runExport() {
    closeDialog();
    exportAction.run();
  }

  function runImport() {
    closeDialog();
    importAction.run();
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title} accessibilityRole="header">
          Backup & Restauração
        </Text>
        <Text style={s.subtitle}>
          Exporte seus dados para guardar ou transferir para outro celular.
        </Text>
      </View>

      <TouchableOpacity
        style={[s.card, s.cardExport]}
        onPress={() => setPendingDialog("export")}
        disabled={loading}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityHint={A11Y_LABELS.backup.exportHint}
        accessibilityState={{ busy: exportAction.isRunning }}
      >
        <View style={[s.cardIcon, s.cardIconExport]} {...HIDDEN_FROM_SCREEN_READER}>
          <Text style={s.icon}>📤</Text>
        </View>
        <View style={s.cardText}>
          <Text style={[s.cardTitle, s.cardTitleExport]}>Exportar dados</Text>
          <Text style={s.cardDescription}>
            Salva o banco de dados atual e abre o compartilhamento do sistema.
          </Text>
        </View>
        {exportAction.isRunning && <ActivityIndicator color={colors.GREEN_COLOR} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.card, s.cardImport]}
        onPress={() => setPendingDialog("import")}
        disabled={loading}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityHint={A11Y_LABELS.backup.importHint}
        accessibilityState={{ busy: importAction.isRunning }}
      >
        <View style={[s.cardIcon, s.cardIconImport]} {...HIDDEN_FROM_SCREEN_READER}>
          <Text style={s.icon}>📥</Text>
        </View>
        <View style={s.cardText}>
          <Text style={[s.cardTitle, s.cardTitleImport]}>Importar dados</Text>
          <Text style={s.cardDescription}>
            Seleciona um arquivo .db e substitui os dados atuais.
          </Text>
        </View>
        {importAction.isRunning && <ActivityIndicator color={colors.RED_COLOR} />}
      </TouchableOpacity>

      <View style={s.warning}>
        <Text style={s.warningIcon} {...HIDDEN_FROM_SCREEN_READER}>
          ⚠️
        </Text>
        <Text style={s.warningText}>
          A importação substitui permanentemente todos os dados existentes. Exporte antes de
          importar.
        </Text>
      </View>

      <ConfirmModal
        visible={pendingDialog === "export"}
        emoji="🔒"
        title={DIALOGS.exportBackup.title}
        message={DIALOGS.exportBackup.message}
        confirmLabel={DIALOGS.exportBackup.confirmLabel}
        onConfirm={runExport}
        onCancel={closeDialog}
      />

      <ConfirmModal
        visible={pendingDialog === "import"}
        emoji="📥"
        title={DIALOGS.importBackup.title}
        message={DIALOGS.importBackup.message}
        confirmLabel={DIALOGS.importBackup.confirmLabel}
        variant="destructive"
        onConfirm={runImport}
        onCancel={closeDialog}
      />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      padding: SPACING[20],
      gap: SPACING[16],
    },

    // Cabeçalho
    header: {
      marginBottom: SPACING[4],
    },
    title: {
      fontSize: FONT_SIZE.TITLE,
      fontWeight: FONT_WEIGHT.BOLD,
      color: colors.TEXT_PRIMARY,
      marginBottom: SPACING[4],
    },
    subtitle: {
      fontSize: FONT_SIZE.BODY,
      color: colors.TEXT_MUTED,
      lineHeight: LINE_HEIGHTS[20],
    },

    // Cards
    card: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: RADIUS[12],
      padding: SPACING[16],
      gap: SPACING[14],
      borderWidth: 1,
    },
    cardExport: {
      backgroundColor: colors.EDIT_BACKGROUND_COLOR,
      borderColor: colors.EDIT_BORDER_COLOR,
    },
    cardImport: {
      backgroundColor: colors.DEACTIVATE_BACKGROUND_COLOR,
      borderColor: colors.DEACTIVATE_BORDER_COLOR,
    },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: RADIUS[22],
      alignItems: "center",
      justifyContent: "center",
    },
    cardIconExport: {
      backgroundColor: colors.PRIMARY_SOFT,
    },
    cardIconImport: {
      backgroundColor: colors.DEACTIVATE_BACKGROUND_COLOR,
    },
    icon: {
      fontSize: FONT_SIZE.TITLE_LARGE,
    },
    cardText: {
      flex: 1,
    },
    cardTitle: {
      fontSize: FONT_SIZE.BODY_LARGE,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
      marginBottom: SPACING[2],
    },
    cardTitleExport: {
      color: colors.EDIT_MAIN_COLOR,
    },
    cardTitleImport: {
      color: colors.DEACTIVATE_MAIN_COLOR,
    },
    cardDescription: {
      fontSize: FONT_SIZE.BODY_SMALL,
      color: colors.TEXT_MUTED,
      lineHeight: LINE_HEIGHTS[18],
    },

    // Aviso
    warning: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: colors.SURFACE_VARIANT,
      borderRadius: RADIUS[10],
      padding: SPACING[12],
      gap: SPACING[8],
      borderWidth: 1,
      borderColor: colors.BORDER_MID,
      marginTop: SPACING[4],
    },
    warningIcon: {
      fontSize: FONT_SIZE.SUBTITLE,
      marginTop: SPACING[1],
    },
    warningText: {
      flex: 1,
      fontSize: FONT_SIZE.SMALL,
      color: colors.TEXT_MUTED,
      lineHeight: LINE_HEIGHTS[17],
    },

    // Overlay
    overlay: {
      flex: 1,
      backgroundColor: colors.MODAL_BACKGROUND,
      alignItems: "center",
      justifyContent: "center",
    },
    overlayBox: {
      backgroundColor: colors.BACKGROUND,
      borderRadius: RADIUS[14],
      padding: SPACING[28],
      alignItems: "center",
      gap: SPACING[14],
      minWidth: 160,
      shadowColor: colors.SHADOW,
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    overlayText: {
      fontSize: FONT_SIZE.BODY_LARGE,
      color: colors.TEXT_PRIMARY,
      fontWeight: FONT_WEIGHT.MEDIUM,
    },
  });
