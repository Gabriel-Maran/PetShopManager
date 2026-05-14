import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { ThemeColors, useThemedStyles } from "../Themes/ThemeProvider";
import DefaultHeader from "../components/Header/DefaultHeader";
import { useScreen } from "../../hooks/useScreen";
import { APP_BAR_HEIGHT, RelatorioType, Screen } from "../../config/consts";
import { NewOrEditAppointmentParams } from "../../model/Appointment";

const REPORTS: {
  id: string;
  type: RelatorioType;
  title: string;
  subtitle: string;
  tag: string;
  accent: string;
}[] = [
  {
    id: "dias",
    type: RelatorioType.DiasHorasMovimentados,
    title: "Dias movimentados",
    subtitle: "Dias com mais agendamentos",
    tag: "Operacional",
    accent: "#6366F1",
  },
  {
    id: "churn",
    type: RelatorioType.PetsAusentes,
    title: "Pets ausentes",
    subtitle: "Clientes sem visita há X dias",
    tag: "Retenção",
    accent: "#EF4444",
  },
  {
    id: "remarcacao",
    type: RelatorioType.Remarcacoes,
    title: "Remarcações",
    subtitle: "Pets com remarcação ativa vs inativos",
    tag: "Engajamento",
    accent: "#F59E0B",
  },
  {
    id: "origem",
    type: RelatorioType.OrigemAgendamentos,
    title: "Origem dos agendamentos",
    subtitle: "Automáticos vs manuais",
    tag: "Operacional",
    accent: "#10B981",
  },
  {
    id: "mensal",
    type: RelatorioType.ComparativoMensal,
    title: "Comparativo mensal",
    subtitle: "Evolução mês a mês",
    tag: "Financeiro",
    accent: "#3B82F6",
  },
  {
    id: "pacotes",
    type: RelatorioType.Pacotes,
    title: "Pacotes ativos",
    subtitle: "Pets no plano 2x/mês vs 4x/mês",
    tag: "Financeiro",
    accent: "#A855F7",
  },
];

const SECTIONS = Array.from(new Set(REPORTS.map((r) => r.tag))).map((tag) => ({
  tag,
  items: REPORTS.filter((r) => r.tag === tag),
}));

export default function Relatorios() {
  const s = useThemedStyles(styles);
  const { navigate } = useScreen<NewOrEditAppointmentParams>();

  return (
    <>
      <DefaultHeader />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.pageTitle}>Relatórios</Text>

        {SECTIONS.map((section) => (
          <View key={section.tag} style={s.section}>
            <Text style={s.sectionLabel}>{section.tag.toUpperCase()}</Text>

            <View style={s.cardList}>
              {section.items.map((report, index) => (
                <TouchableOpacity
                  key={report.id}
                  style={[
                    s.card,
                    index === section.items.length - 1 && s.cardLast,
                  ]}
                  onPress={() =>
                    navigate(Screen.RelatorioView, { type: report.type })
                  }
                  activeOpacity={0.65}
                >
                  <View
                    style={[s.cardAccent, { backgroundColor: report.accent }]}
                  />
                  <View style={s.cardBody}>
                    <Text style={s.cardTitle}>{report.title}</Text>
                    <Text style={s.cardSubtitle}>{report.subtitle}</Text>
                  </View>
                  <Text style={s.cardArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: colors.BACKGROUND,
      marginBottom: APP_BAR_HEIGHT,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 28,
      paddingBottom: 40,
      gap: 28,
    },
    pageTitle: {
      fontSize: 26,
      fontWeight: "700",
      color: colors.TEXT_PRIMARY,
      letterSpacing: -0.5,
    },
    section: {
      gap: 8,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.3,
      color: colors.TEXT_MUTED,
      marginLeft: 2,
    },
    cardList: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.BORDER_STRONG,
      overflow: "hidden",
      backgroundColor: colors.THIRD_BACKGROUND,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingRight: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.BORDER_STRONG,
      gap: 12,
    },
    cardLast: {
      borderBottomWidth: 0,
    },
    cardAccent: {
      width: 3,
      height: 36,
      borderRadius: 99,
      marginLeft: 14,
    },
    cardBody: {
      flex: 1,
      gap: 2,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.TEXT_PRIMARY,
    },
    cardSubtitle: {
      fontSize: 12,
      color: colors.TEXT_MUTED,
    },
    cardArrow: {
      fontSize: 20,
      color: colors.TEXT_MUTED,
      fontWeight: "300",
      lineHeight: 22,
    },
  });
