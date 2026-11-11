import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../theme/ThemeProvider";
import BarChart from "../../components/reports/BarChart";
import TitleBar from "../../components/registry/TitleBar";

import { useAsyncData } from "../../../hooks/useAsyncData";
import { reportsService } from "../../../service/ReportsService";
import { PackageFrequency } from "../../../config/consts";
import { RADIUS, SPACING } from "../../theme/tokens";

export default function ActivePackagesReport() {
  const { data, loading } = useAsyncData(() =>
    Promise.all([
      reportsService.getActivePackages(),
      reportsService.getPetsInPackage(PackageFrequency.Biweekly),
      reportsService.getPetsInPackage(PackageFrequency.Weekly),
    ]),
  );

  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  const titleBar = (
    <TitleBar
      title="Planos Ativos"
      subtitle="Quinzenal e semanal"
    />
  );

  if (loading) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
      </View>
    );
  }

  // Sem os dados, a falha já apareceu no modal de erro: fica só o título, para voltar.
  if (!data) {
    return <View style={s.loader}>{titleBar}</View>;
  }

  const [packageBars, biweeklyBars, weeklyBars] = data;

  return (
    <View style={s.mainContainer}>
      <TitleBar
        title="Planos Ativos"
        subtitle={`${packageBars.reduce((acc, p) => acc + p.y, 0)} pets com remarcação automática`}
      />

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Gráfico geral ─────────────────────────────────────────── */}
        <View style={s.card}>
          <BarChart
            data={packageBars}
            title="Distribuição por plano"
            suffix="pets"
          />
        </View>

        {/* ── Lista Quinzenal ───────────────────────────────────────── */}
        {biweeklyBars.length > 0 && (
          <View style={s.card}>
            <BarChart
              data={biweeklyBars}
              title={`Quinzenal · 2x/mês  (${biweeklyBars.length})`}
              suffix="x/mês"
              height={120}
            />
          </View>
        )}

        {/* ── Lista Semanal ─────────────────────────────────────────── */}
        {weeklyBars.length > 0 && (
          <View style={s.card}>
            <BarChart
              data={weeklyBars}
              title={`Semanal · 4x/mês  (${weeklyBars.length})`}
              suffix="x/mês"
              height={120}
            />
          </View>
        )}
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
      padding: SPACING[16],
      alignItems: "center",
    },
    card: {
      width: "100%",
      backgroundColor: colors.SURFACE,
      borderRadius: RADIUS[12],
      padding: SPACING[16],
      marginBottom: SPACING[20],
      elevation: 3,
      shadowColor: colors.SHADOW,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
  });
