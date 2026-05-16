import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../Themes/ThemeProvider";
import BarChart from "../../components/Relatorios/BarChart";
import { useEffect, useState } from "react";
import { PlanoItem, Screen } from "../../../config/consts";
import TitleBar from "../../components/Cadastro/TitleBar";

import { useError } from "../../../hooks/useError";
import {
  getPetsPorPlano,
  getPlanosAtivos,
  PetPlanoDetalhe,
} from "../../../utils/relatorios/getPetsPorPlano";

export default function PlanosAtivos() {
  const [planos, setPlanos] = useState<PlanoItem[]>([]);
  const [quinzenal, setQuinzenal] = useState<PetPlanoDetalhe[]>([]);
  const [semanal, setSemanal] = useState<PetPlanoDetalhe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useError();

  const { colors } = useTheme();
  const s = useThemedStyles(styles);

  useEffect(() => {
    Promise.all([getPlanosAtivos(), getPetsPorPlano(2), getPetsPorPlano(4)])
      .then(([p, q, s]) => {
        setPlanos(p);
        setQuinzenal(q);
        setSemanal(s);
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
          title="Planos Ativos"
          subtitle="Quinzenal e semanal"
        />
      </View>
    );
  }

  return (
    <View style={s.mainContainer}>
      <TitleBar
        returnTo={Screen.Relatorios}
        title="Planos Ativos"
        subtitle={`${planos.reduce((acc, p) => acc + p.y, 0)} pets com remarcação automática`}
      />

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Gráfico geral ─────────────────────────────────────────── */}
        <View style={s.card}>
          <BarChart
            data={planos}
            title="Distribuição por plano"
            suffix="pets"
          />
        </View>

        {/* ── Lista Quinzenal ───────────────────────────────────────── */}
        {quinzenal.length > 0 && (
          <View style={s.card}>
            <BarChart
              data={quinzenal.map((p) => ({
                x: p.petNome,
                y: p.pacote,
              }))}
              title={`Quinzenal · 2x/mês  (${quinzenal.length})`}
              suffix="x/mês"
              height={120}
            />
          </View>
        )}

        {/* ── Lista Semanal ─────────────────────────────────────────── */}
        {semanal.length > 0 && (
          <View style={s.card}>
            <BarChart
              data={semanal.map((p) => ({
                x: p.petNome,
                y: p.pacote,
              }))}
              title={`Semanal · 4x/mês  (${semanal.length})`}
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
      padding: 16,
      alignItems: "center",
    },
    card: {
      width: "100%",
      backgroundColor: colors.SURFACE,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
  });
