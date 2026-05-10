import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { exportDatabase, importDatabase } from "../../service/BackupService";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Action = "export" | "import";

interface DatabaseTransferProps {
  /** Chamado após importação bem-sucedida (ex: navegar para home) */
  onImportSuccess?: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function DatabaseTransfer({ onImportSuccess }: DatabaseTransferProps) {
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<Action | null>(null);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleExport() {
    setLoading(true);
    setLoadingAction("export");
    try {
      await exportDatabase();
    } catch (e: any) {
      Alert.alert("Erro ao exportar", e?.message ?? "Erro desconhecido.");
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  }

  function handleImportPress() {
    Alert.alert(
      "Importar banco de dados",
      "Isso substituirá TODOS os dados atuais. Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          style: "destructive",
          onPress: handleImport,
        },
      ],
    );
  }

  async function handleImport() {
    setLoading(true);
    setLoadingAction("import");
    try {
      await importDatabase();
      Alert.alert(
        "Importação concluída",
        "O banco de dados foi restaurado com sucesso.",
        [{ text: "OK", onPress: onImportSuccess }],
      );
    } catch (e: any) {
      Alert.alert("Erro ao importar", e?.message ?? "Erro desconhecido.");
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>Backup & Restauração</Text>
        <Text style={styles.subtitle}>
          Exporte seus dados para guardar ou transferir para outro celular.
        </Text>
      </View>

      {/* Card Exportar */}
      <TouchableOpacity
        style={[styles.card, styles.cardExport]}
        onPress={handleExport}
        disabled={loading}
        activeOpacity={0.75}
      >
        <View style={styles.cardIcon}>
          <Text style={styles.icon}>📤</Text>
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>Exportar dados</Text>
          <Text style={styles.cardDescription}>
            Salva o banco de dados atual e abre o compartilhamento do sistema.
          </Text>
        </View>
        {loading && loadingAction === "export" ? (
          <ActivityIndicator color="#2e7d32" />
        ) : null}
      </TouchableOpacity>

      {/* Card Importar */}
      <TouchableOpacity
        style={[styles.card, styles.cardImport]}
        onPress={handleImportPress}
        disabled={loading}
        activeOpacity={0.75}
      >
        <View style={styles.cardIcon}>
          <Text style={styles.icon}>📥</Text>
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>Importar dados</Text>
          <Text style={styles.cardDescription}>
            Seleciona um arquivo .db e substitui os dados atuais.
          </Text>
        </View>
        {loading && loadingAction === "import" ? (
          <ActivityIndicator color="#b71c1c" />
        ) : null}
      </TouchableOpacity>

      {/* Aviso */}
      <View style={styles.warning}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningText}>
          A importação substitui permanentemente todos os dados existentes.
          Exporte antes de importar.
        </Text>
      </View>

      {/* Overlay de loading global */}
      <Modal transparent visible={loading} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <ActivityIndicator size="large" color="#555" />
            <Text style={styles.overlayText}>
              {loadingAction === "export" ? "Exportando..." : "Importando..."}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
    color: "#1a1a1a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
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
    backgroundColor: "#f1f8e9",
    borderColor: "#aed581",
  },
  cardImport: {
    backgroundColor: "#fbe9e7",
    borderColor: "#ef9a9a",
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
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
    color: "#1a1a1a",
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
  },

  // Aviso
  warning: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff8e1",
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#ffe082",
    marginTop: 4,
  },
  warningIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: "#795548",
    lineHeight: 17,
  },

  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayBox: {
    backgroundColor: "#fff",
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
    color: "#333",
    fontWeight: "500",
  },
});
