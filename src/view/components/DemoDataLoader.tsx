import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { DEMO_DATA_SUMMARY } from "../../config/demoData";
import { isAppEmpty, loadDemoData, resetToDemoData } from "../../service/DemoDataService";
import { ThemeColors, useTheme, useThemedStyles } from "../theme/ThemeProvider";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import ConfirmModal from "./ConfirmModal";
import { HIDDEN_FROM_SCREEN_READER } from "./accessibility/accessibilityProps";
import { FONT_SIZE, FONT_WEIGHT, LINE_HEIGHTS, RADIUS, SPACING } from "../theme/tokens";

interface DemoDataLoaderProps {
  onLoaded?: () => void;
}

type DemoAction = "load" | "reset";

const DEMO_DATA_CONTENT =
  `${DEMO_DATA_SUMMARY.owners} donos e ${DEMO_DATA_SUMMARY.pets} pets fictícios, ` +
  `${DEMO_DATA_SUMMARY.packages} deles com pacote, e os agendamentos de cada um.`;

const ACTIONS = {
  load: {
    emoji: "🐾",
    title: "Carregar dados de exemplo",
    description:
      "Preenche o app vazio com donos, pets, pacotes e agendamentos fictícios, para conhecer as telas e os relatórios.",
    confirmMessage:
      `Serão criados ${DEMO_DATA_CONTENT} ` +
      "Os dados ficam no app; para começar do zero depois, limpe os dados do app nas configurações do Android.",
    confirmLabel: "Carregar",
    destructive: false,
    run: loadDemoData,
  },
  reset: {
    emoji: "🧹",
    title: "Apagar tudo e carregar exemplo",
    description:
      "Só no modo de desenvolvimento: apaga todos os dados, recria o banco e carrega os dados de exemplo.",
    confirmMessage:
      "Isso apaga TODOS os donos, pets e agendamentos e recria o banco do zero, com as configurações no padrão. " +
      `Depois, serão criados ${DEMO_DATA_CONTENT} Esta ação não pode ser desfeita.`,
    confirmLabel: "Apagar e carregar",
    destructive: true,
    run: resetToDemoData,
  },
} as const;

/** Com o app vazio, carregar. Com dados, apagar tudo antes, mas só no modo de desenvolvimento. */
function availableAction(isEmpty: boolean): DemoAction | null {
  if (isEmpty) return "load";
  return __DEV__ ? "reset" : null;
}

/**
 * Carrega os dados de exemplo. No APK, só aparece com o app vazio, para nunca misturar com dados
 * reais. No modo de desenvolvimento, com dados, oferece apagar tudo e carregar de novo.
 */
export function DemoDataLoader({ onLoaded }: DemoDataLoaderProps) {
  const [action, setAction] = useState<DemoAction | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  useEffect(() => {
    let mounted = true;
    isAppEmpty()
      .then((empty) => mounted && setAction(availableAction(empty)))
      // Se a checagem falhar, o botão só não aparece: a função é opcional e o resto da tela segue.
      .catch(() => mounted && setAction(null));
    return () => {
      mounted = false;
    };
  }, []);

  const { run, isRunning: loading } = useAsyncAction(async (current: DemoAction) => {
    await ACTIONS[current].run();
    setAction(availableAction(false));
    onLoaded?.();
  });

  function runAction(current: DemoAction) {
    setConfirmVisible(false);
    run(current);
  }

  if (!action) return null;
  const config = ACTIONS[action];

  return (
    <View style={s.container}>
      <TouchableOpacity
        style={[s.card, config.destructive && s.cardDestructive]}
        onPress={() => setConfirmVisible(true)}
        disabled={loading}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityState={{ busy: loading }}
      >
        <View
          style={[s.cardIcon, config.destructive && s.cardIconDestructive]}
          {...HIDDEN_FROM_SCREEN_READER}
        >
          <Text style={s.icon}>{config.emoji}</Text>
        </View>
        <View style={s.cardText}>
          <Text style={[s.cardTitle, config.destructive && s.cardTitleDestructive]}>
            {config.title}
          </Text>
          <Text style={s.cardDescription}>{config.description}</Text>
        </View>
        {loading && (
          <ActivityIndicator color={config.destructive ? colors.RED_COLOR : colors.GREEN_COLOR} />
        )}
      </TouchableOpacity>

      <ConfirmModal
        visible={confirmVisible}
        emoji={config.emoji}
        title={config.title}
        message={config.confirmMessage}
        confirmLabel={config.confirmLabel}
        variant={config.destructive ? "destructive" : "default"}
        onConfirm={() => runAction(action)}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
// Os mesmos dos cartões do DatabaseTransfer, logo abaixo na tela: carregar como o de exportar, e
// apagar tudo como o de importar.

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: SPACING[20],
      paddingTop: SPACING[20],
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: RADIUS[12],
      padding: SPACING[16],
      gap: SPACING[14],
      borderWidth: 1,
      backgroundColor: colors.EDIT_BACKGROUND_COLOR,
      borderColor: colors.EDIT_BORDER_COLOR,
    },
    cardDestructive: {
      backgroundColor: colors.DEACTIVATE_BACKGROUND_COLOR,
      borderColor: colors.DEACTIVATE_BORDER_COLOR,
    },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: RADIUS[22],
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.PRIMARY_SOFT,
    },
    cardIconDestructive: {
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
      color: colors.EDIT_MAIN_COLOR,
    },
    cardTitleDestructive: {
      color: colors.DEACTIVATE_MAIN_COLOR,
    },
    cardDescription: {
      fontSize: FONT_SIZE.BODY_SMALL,
      color: colors.TEXT_MUTED,
      lineHeight: LINE_HEIGHTS[18],
    },
  });
