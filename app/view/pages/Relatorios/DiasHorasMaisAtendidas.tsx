import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useScreen } from "../../../hooks/useScreen";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";
import BarChart, { BarChartItem } from "../../components/Relatorios/BarChart";
import { useEffect, useState } from "react";

import { Screen } from "../../../config/consts";
import TitleBar from "../../components/Cadastro/TitleBar";
import {
  getDiasMaisAtendidos,
  getHorasMaisAtendidas,
} from "../../../utils/relatorios/datasSearcher";

export default function DiasHorasMaisAtendidas() {
  const [data, setData] = useState<BarChartItem[]>([]);
  const [hora, setHora] = useState<BarChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { colors } = useTheme(); // Pega as cores para o ActivityIndicator
  const s = useThemedStyles(styles);

  useEffect(() => {
    getDiasMaisAtendidos()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getHorasMaisAtendidas()
      .then(setHora)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const { navigate } = useScreen();

  if (loading) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
      </View>
    );
  }

  return (
    <>
      <View style={s.mainContainer}>
        <TitleBar
          returnTo={Screen.Relatorios}
          title="Frequência de Atendimento"
          subtitle="Análise de picos de horários e dias"
        />

        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.card}>
            <BarChart data={data} title="Dias mais atendidos" suffix="atend." />
          </View>

          <View style={s.card}>
            <BarChart
              data={hora}
              title="Horas mais atendidas"
              suffix="atend."
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
      backgroundColor: colors.BACKGROUND, // Usa o fundo do seu tema
    },
    loader: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.BACKGROUND,
    },
    scrollContent: {
      padding: 16, // Espaçamento nas bordas da tela
      alignItems: "center",
    },
    card: {
      width: "100%",
      backgroundColor: colors.SURFACE, // Ou colors.card se tiver
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      // Sombra leve para dar profundidade
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
  });
