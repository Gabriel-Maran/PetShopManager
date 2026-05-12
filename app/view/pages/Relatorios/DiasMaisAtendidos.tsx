import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { RelatorioType, Screen } from "../../../config/consts";
import { useScreen } from "../../../hooks/useScreen";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";
import BarChart, { BarChartItem } from "../../components/Relatorios/BarChart";
import { useEffect, useState } from "react";
import { getDiasMaisAtendidos } from "../../../utils/getDiasMaisAtendidos";
import { getDatabase } from "../../../config/database";

export default function DiasMaisAtendidos() {
  const [data, setData] = useState<BarChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const s = useThemedStyles(styles);
  useEffect(() => {
    getDiasMaisAtendidos()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const { navigate } = useScreen();
  const { colors } = useTheme();
  if (loading) return <ActivityIndicator />;

  return (
    <>
      <View style={s.container}>
        <Button onPress={() => navigate(Screen.Relatorios)} title="VOLTAR" />
        <Text style={{ color: colors.TEXT_PRIMARY }}>
          <BarChart data={data} title="Dias mais atendidos" suffix="atend." />
        </Text>
      </View>
    </>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
  });
