import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";
import BarChart, { BarChartItem } from "../../components/Relatorios/BarChart";
import { useEffect, useState } from "react";

import { Screen } from "../../../config/consts";
import TitleBar from "../../components/Cadastro/TitleBar";

import { autoVsManuais } from "../../../utils/relatorios/origemDados";

export default function OrigemAgendamentos() {
  const [dataOrigem, setDataOrigem] = useState<BarChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  useEffect(() => {
    setLoading(true);
    autoVsManuais()
      .then(setDataOrigem)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
      </View>
    );
  }

  return (
    <View style={s.mainContainer}>
      <TitleBar
        returnTo={Screen.Relatorios}
        title="Origem dos Agendamentos"
        subtitle="Comparativo entre canais automáticos e manuais"
      />
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <BarChart
            data={dataOrigem}
            title="Agendamentos por Canal"
            suffix="atend."
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: colors.BACKGROUND,
    },
    loader: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.BACKGROUND,
    },
    scrollContent: {
      padding: 16,
      alignItems: "center",
    },
    card: {
      width: "100%",
      backgroundColor: colors.SURFACE,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 6,
      marginBottom: 20,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
  });
