import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { exportDatabase, importDatabase } from "../../service/BackupService";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../Themes/ThemeProvider";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import ConfirmModal from "./ConfirmModal";

interface DatabaseTransferProps {
  onImportSuccess?: () => void;
}

export function DatabaseTransfer({ onImportSuccess }: DatabaseTransferProps) {
  const [confirmVisible, setConfirmVisible] = useState(false);

  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  const exportAction = useAsyncAction(exportDatabase);
  const importAction = useAsyncAction(async () => {
    if (await importDatabase()) onImportSuccess?.();
  });
  const loading = exportAction.isRunning || importAction.isRunning;

  function runImport() {
    setConfirmVisible(false);
    importAction.run();
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Backup & Restauração</Text>
        <Text style={s.subtitle}>
          Exporte seus dados para guardar ou transferir para outro celular.
        </Text>
      </View>

      <TouchableOpacity
        style={[s.card, s.cardExport]}
        onPress={() => exportAction.run()}
        disabled={loading}
        activeOpacity={0.75}
      >
        <View style={[s.cardIcon, s.cardIconExport]}>
          <Text style={s.icon}>📤</Text>
        </View>
        <View style={s.cardText}>
          <Text style={[s.cardTitle, s.cardTitleExport]}>Exportar dados</Text>
          <Text style={s.cardDescription}>
            Salva o banco de dados atual e abre o compartilhamento do sistema.
          </Text>
        </View>
        {exportAction.isRunning && (
          <ActivityIndicator color={colors.GREEN_COLOR} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.card, s.cardImport]}
        onPress={() => setConfirmVisible(true)}
        disabled={loading}
        activeOpacity={0.75}
      >
        <View style={[s.cardIcon, s.cardIconImport]}>
          <Text style={s.icon}>📥</Text>
        </View>
        <View style={s.cardText}>
          <Text style={[s.cardTitle, s.cardTitleImport]}>Importar dados</Text>
          <Text style={s.cardDescription}>
            Seleciona um arquivo .db e substitui os dados atuais.
          </Text>
        </View>
        {importAction.isRunning && (
          <ActivityIndicator color={colors.RED_COLOR} />
        )}
      </TouchableOpacity>

      <View style={s.warning}>
        <Text style={s.warningIcon}>⚠️</Text>
        <Text style={s.warningText}>
          A importação substitui permanentemente todos os dados existentes.
          Exporte antes de importar.
        </Text>
      </View>

      <ConfirmModal
        visible={confirmVisible}
        emoji="📥"
        title="Importar banco de dados"
        message="Isso substituirá TODOS os dados atuais. Esta ação não pode ser desfeita."
        confirmLabel="Importar"
        variant="destructive"
        onConfirm={runImport}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      padding: 20,
      gap: 16,
    },

    // Cabeçalho
    header: {
      marginBottom: 4,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.TEXT_PRIMARY,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.TEXT_MUTED,
      lineHeight: 20,
    },

    // Cards
    card: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      padding: 16,
      gap: 14,
      borderWidth: 1,
    },
    cardExport: {
      backgroundColor: colors.EDITAR_BACKGROUND_COLOR,
      borderColor: colors.EDITAR_BORDER_COLOR,
    },
    cardImport: {
      backgroundColor: colors.EXCLUIR_BACKGROUND_COLOR,
      borderColor: colors.EXCLUIR_BORDER_COLOR,
    },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    cardIconExport: {
      backgroundColor: colors.PRIMARY_SOFT,
    },
    cardIconImport: {
      backgroundColor: colors.EXCLUIR_BACKGROUND_COLOR,
    },
    icon: {
      fontSize: 22,
    },
    cardText: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 2,
    },
    cardTitleExport: {
      color: colors.EDITAR_MAIN_COLOR,
    },
    cardTitleImport: {
      color: colors.EXCLUIR_MAIN_COLOR,
    },
    cardDescription: {
      fontSize: 13,
      color: colors.TEXT_MUTED,
      lineHeight: 18,
    },

    // Aviso
    warning: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: colors.SURFACE_VARIANT,
      borderRadius: 10,
      padding: 12,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.BORDER_MID,
      marginTop: 4,
    },
    warningIcon: {
      fontSize: 16,
      marginTop: 1,
    },
    warningText: {
      flex: 1,
      fontSize: 12,
      color: colors.TEXT_MUTED,
      lineHeight: 17,
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
      borderRadius: 14,
      padding: 28,
      alignItems: "center",
      gap: 14,
      minWidth: 160,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    overlayText: {
      fontSize: 15,
      color: colors.TEXT_PRIMARY,
      fontWeight: "500",
    },
  });
