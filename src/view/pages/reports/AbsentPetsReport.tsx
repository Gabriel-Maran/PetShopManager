import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { ThemeColors, useThemedStyles } from "../../theme/ThemeProvider";
import { useTheme } from "../../theme/ThemeProvider";
import BarChart from "../../components/reports/BarChart";
import { reportsService } from "../../../service/ReportsService";
import TitleBar from "../../components/registry/TitleBar";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { RADIUS, SPACING } from "../../theme/tokens";

export default function AbsentPetsReport() {
  const { data, loading } = useAsyncData(() =>
    Promise.all([
      reportsService.getAbsentPets(false),
      reportsService.getAbsentPets(true),
    ]),
  );

  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  const titleBar = (
    <TitleBar
      title="Pets Ausentes"
      subtitle="Pets há mais tempo sem visita"
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

  const [petsWithoutPackage, petsWithPackage] = data;

  return (
    <View style={s.mainContainer}>
      {titleBar}
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <BarChart
            data={petsWithoutPackage}
            title="Sem remarcação automática"
            suffix="dias"
            verticalLabels
            height={150}
            invertLabelY={true}
          />
        </View>
        <View style={s.card}>
          <BarChart
            data={petsWithPackage}
            title="Com remarcação automática"
            suffix="dias"
            verticalLabels
            height={150}
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
