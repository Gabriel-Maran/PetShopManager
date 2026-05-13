import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { ThemeColors, useThemedStyles } from "../../Themes/ThemeProvider";
import { useTheme } from "../../Themes/ThemeProvider";
import BarChart from "../../components/Relatorios/BarChart";
import { PetAusenteItem } from "../../../utils/relatorios/petsAusentes";
import {
  petsAusentesComRemarcacao,
  petsAusentesSemRemarcacao,
} from "../../../utils/relatorios/petsAusentes";
import { Screen } from "../../../config/consts";
import TitleBar from "../../components/Cadastro/TitleBar";
import { useError } from "../../../hooks/useError";

export default function PetsAusentes() {
  const [petsSemRemarc, setPetsSemRemarc] = useState<PetAusenteItem[]>([]);
  const [petsComRemarc, setPetsComRemarc] = useState<PetAusenteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useError();

  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  useEffect(() => {
    // Promise.all garante que setLoading(false) só ocorre quando AMBAS terminam,
    // e um único catch captura qualquer falha das duas
    Promise.all([petsAusentesSemRemarcacao(), petsAusentesComRemarcacao()])
      .then(([semRemarc, comRemarc]) => {
        setPetsSemRemarc(semRemarc);
        setPetsComRemarc(comRemarc);
      })
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
          title="Pets Ausentes"
          subtitle="Pets há mais tempo sem visita"
        />
      </View>
    );
  }

  return (
    <View style={s.mainContainer}>
      <TitleBar
        returnTo={Screen.Relatorios}
        title="Pets Ausentes"
        subtitle="Pets há mais tempo sem visita"
      />
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
