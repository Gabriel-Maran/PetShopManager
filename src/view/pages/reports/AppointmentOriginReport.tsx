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

export default function AppointmentOriginReport() {
  const { data, loading } = useAsyncData(() =>
    Promise.all([
      reportsService.getAppointmentsByOrigin(true),
      reportsService.getAppointmentsByOrigin(false),
    ]),
  );

  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  const titleBar = (
    <TitleBar
      title="Origem dos Agendamentos"
      subtitle="Canais automáticos e manuais"
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

  const [completedByOrigin, scheduledByOrigin] = data;

  return (
    <View style={s.mainContainer}>
      {titleBar}
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <BarChart
            data={completedByOrigin}
            title="Agendamentos Concluídos"
            suffix="atend."
            invertLabelY={true}
          />
        </View>
        <View style={s.card}>
          <BarChart
            data={scheduledByOrigin}
            title="Agendamentos Pendentes"
            suffix="atend."
            invertLabelY={true}
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
      padding: SPACING[16],
      alignItems: "center",
    },
    card: {
      width: "100%",
      backgroundColor: colors.SURFACE,
      borderRadius: RADIUS[12],
      paddingVertical: SPACING[16],
      paddingHorizontal: SPACING[6],
      marginBottom: SPACING[20],
      elevation: 3,
      shadowColor: colors.SHADOW,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
  });
