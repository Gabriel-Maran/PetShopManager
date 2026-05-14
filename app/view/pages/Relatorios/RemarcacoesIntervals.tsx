import { useEffect, useState } from "react";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Screen } from "../../../config/consts";
import TitleBar from "../../components/Cadastro/TitleBar";
import BarChart, { BarChartItem } from "../../components/Relatorios/BarChart";
import { useError } from "../../../hooks/useError";
import { comparativoRemarcacao } from "../../../utils/relatorios/remarcacoes";

export default function RemarcacoesIntervals() {
  const [petsRemarc, setPetsRemarc] = useState<BarChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useError();

  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  useEffect(() => {
    setLoading(true);
    comparativoRemarcacao()
      .then((dados) => setPetsRemarc(dados))
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

  if (error) {
    showError(error);
    return (
      <View style={s.loader}>
        <TitleBar
          returnTo={Screen.Relatorios}
          title="Remarcações Pets"
          subtitle="Remarcação automática ativa e inativa"
        />
      </View>
    );
  }

  return (
    <View style={s.mainContainer}>
      <TitleBar
        returnTo={Screen.Relatorios}
        title="Remarcações Pets"
        subtitle="Remarcação automática ativa e inativa"
      />
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <BarChart
            data={petsRemarc}
            title="Remarcação ativa vs inativa"
            suffix="pets"
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
