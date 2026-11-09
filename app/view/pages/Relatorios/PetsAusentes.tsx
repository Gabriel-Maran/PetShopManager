import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { ThemeColors, useThemedStyles } from "../../Themes/ThemeProvider";
import { useTheme } from "../../Themes/ThemeProvider";
import BarChart from "../../components/Relatorios/BarChart";
import {
  petsAusentesComRemarcacao,
  petsAusentesSemRemarcacao,
} from "../../../utils/relatorios/petsAusentes";
import { Screen } from "../../../config/consts";
import TitleBar from "../../components/Cadastro/TitleBar";
import { useAsyncData } from "../../../hooks/useAsyncData";

export default function PetsAusentes() {
  const { data, loading } = useAsyncData(() =>
    Promise.all([petsAusentesSemRemarcacao(), petsAusentesComRemarcacao()]),
  );

  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  const titleBar = (
    <TitleBar
      returnTo={Screen.Relatorios}
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

  const [petsSemRemarc, petsComRemarc] = data;

  return (
    <View style={s.mainContainer}>
      {titleBar}
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <BarChart
            data={petsSemRemarc}
            title="Sem remarcação automática"
            suffix="dias"
            verticalLabels
            height={150}
            invertLabelY={true}
          />
        </View>
        <View style={s.card}>
          <BarChart
            data={petsComRemarc}
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
