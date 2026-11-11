import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../theme/ThemeProvider";
import BarChart from "../../components/reports/BarChart";

import TitleBar from "../../components/registry/TitleBar";
import { reportsService } from "../../../service/ReportsService";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { RADIUS, SPACING } from "../../theme/tokens";

export default function BusiestDaysReport() {
  const { data, loading } = useAsyncData(() =>
    Promise.all([
      reportsService.getCompletedByWeekday(),
      reportsService.getCompletedByHour(),
    ]),
  );

  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  const titleBar = (
    <TitleBar
      title="Frequência de Atendimento"
      subtitle="Análise de picos de horários e dias"
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

  const [days, hours] = data;

  return (
    <>
      <View style={s.mainContainer}>
        {titleBar}

        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.card}>
            <BarChart
              data={days}
              title="Dias mais atendidos"
              suffix="atend."
              invertLabelY={true}
            />
          </View>

          <View style={s.card}>
            <BarChart
              data={hours}
              title="Horas mais atendidas"
              suffix="atend."
              invertLabelY={true}
            />
          </View>
        </ScrollView>
      </View>
    </>
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
      padding: SPACING[16], // Espaçamento nas bordas da tela
      alignItems: "center",
    },
    card: {
      width: "100%",
      backgroundColor: colors.SURFACE,
      borderRadius: RADIUS[12],
      padding: SPACING[16],
      marginBottom: SPACING[20],
      // Sombra leve para dar profundidade
      elevation: 3,
      shadowColor: colors.SHADOW,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
  });
