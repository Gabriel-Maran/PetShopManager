import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { DEMO_DATA_SUMMARY } from "../../config/demoData";
import { isAppEmpty, loadDemoData } from "../../service/DemoDataService";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../Themes/ThemeProvider";
import ErrorModal from "./Error/ErrorModal";
import ConfirmModal from "./ConfirmModal";

interface DemoDataLoaderProps {
  onLoaded?: () => void;
}

const CONFIRM_MESSAGE =
  `Serão criados ${DEMO_DATA_SUMMARY.owners} donos e ${DEMO_DATA_SUMMARY.pets} pets fictícios, ` +
  `${DEMO_DATA_SUMMARY.packages} deles com pacote, e os agendamentos de cada um. ` +
  "Os dados ficam no app; para começar do zero depois, limpe os dados do app nas configurações do Android.";

/** Carrega os dados de exemplo. Só aparece com o app vazio, para nunca misturar com dados reais. */
export function DemoDataLoader({ onLoaded }: DemoDataLoaderProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  useEffect(() => {
    let mounted = true;
    isAppEmpty()
      .then((empty) => mounted && setVisible(empty))
      // Se a checagem falhar, o botão só não aparece: a função é opcional e o resto da tela segue.
      .catch(() => mounted && setVisible(false));
    return () => {
      mounted = false;
    };
  }, []);

  async function runLoad() {
    setConfirmVisible(false);
    setLoading(true);
    try {
      await loadDemoData();
      setVisible(false);
      onLoaded?.();
    } catch (e: unknown) {
      setErrorMsg(
        e instanceof Error
          ? e.message
          : "Erro desconhecido ao carregar os dados de exemplo.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <View style={s.container}>
      <TouchableOpacity
        style={s.card}
        onPress={() => setConfirmVisible(true)}
        disabled={loading}
        activeOpacity={0.75}
        accessibilityRole="button"
      >
        <View style={s.cardIcon}>
          <Text style={s.icon}>🐾</Text>
        </View>
        <View style={s.cardText}>
          <Text style={s.cardTitle}>Carregar dados de exemplo</Text>
          <Text style={s.cardDescription}>
            Preenche o app vazio com donos, pets, pacotes e agendamentos
            fictícios, para conhecer as telas e os relatórios.
          </Text>
        </View>
        {loading && <ActivityIndicator color={colors.GREEN_COLOR} />}
      </TouchableOpacity>

      <ConfirmModal
        visible={confirmVisible}
        emoji="🐾"
        title="Carregar dados de exemplo"
        message={CONFIRM_MESSAGE}
        confirmLabel="Carregar"
        onConfirm={runLoad}
        onCancel={() => setConfirmVisible(false)}
      />

      <ErrorModal message={errorMsg} onClose={() => setErrorMsg(null)} />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
// Os mesmos do cartão de exportar, no DatabaseTransfer, logo abaixo na tela.

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      padding: 16,
      gap: 14,
      borderWidth: 1,
      backgroundColor: colors.EDITAR_BACKGROUND_COLOR,
      borderColor: colors.EDITAR_BORDER_COLOR,
    },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.PRIMARY_SOFT,
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
      color: colors.EDITAR_MAIN_COLOR,
    },
    cardDescription: {
      fontSize: 13,
      color: colors.TEXT_MUTED,
      lineHeight: 18,
    },
  });
