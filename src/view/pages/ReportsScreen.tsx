import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../theme/ThemeProvider";
import DefaultHeader from "../components/header/DefaultHeader";
import { useScreen } from "../../hooks/useScreen";
import { APP_BAR_HEIGHT, ReportType, Screen } from "../../config/consts";
import { NewOrEditAppointmentParams } from "../../model/Appointment";
import { HIDDEN_FROM_SCREEN_READER } from "../components/accessibility/accessibilityProps";
import {
  FONT_SIZE,
  FONT_WEIGHT,
  LETTER_SPACINGS,
  LINE_HEIGHTS,
  RADIUS,
  SPACING,
} from "../theme/tokens";

type ReportAccent = Extract<keyof ThemeColors, `REPORT_ACCENT_${string}`>;

const REPORTS: {
  id: string;
  type: ReportType;
  title: string;
  subtitle: string;
  tag: string;
  accent: ReportAccent;
}[] = [
  {
    id: "dias",
    type: ReportType.BusiestDaysAndHours,
    title: "Dias movimentados",
    subtitle: "Dias com mais agendamentos",
    tag: "Operacional",
    accent: "REPORT_ACCENT_BUSY_DAYS",
  },
  {
    id: "churn",
    type: ReportType.AbsentPets,
    title: "Pets ausentes",
    subtitle: "Clientes sem visita há X dias",
    tag: "Retenção",
    accent: "REPORT_ACCENT_ABSENT_PETS",
  },
  {
    id: "remarcacao",
    type: ReportType.Reschedules,
    title: "Remarcações",
    subtitle: "Pets com remarcação ativa vs inativos",
    tag: "Engajamento",
    accent: "REPORT_ACCENT_RESCHEDULES",
  },
  {
    id: "origem",
    type: ReportType.AppointmentOrigin,
    title: "Origem dos agendamentos",
    subtitle: "Automáticos vs manuais",
    tag: "Operacional",
    accent: "REPORT_ACCENT_ORIGIN",
  },
  {
    id: "mensal",
    type: ReportType.MonthlyComparison,
    title: "Comparativo mensal",
    subtitle: "Evolução mês a mês",
    tag: "Financeiro",
    accent: "REPORT_ACCENT_MONTHLY",
  },
  {
    id: "pacotes",
    type: ReportType.Packages,
    title: "Pacotes ativos",
    subtitle: "Pets no plano 2x/mês vs 4x/mês",
    tag: "Financeiro",
    accent: "REPORT_ACCENT_PACKAGES",
  },
];

const SECTIONS = Array.from(new Set(REPORTS.map((r) => r.tag))).map((tag) => ({
  tag,
  items: REPORTS.filter((r) => r.tag === tag),
}));

export default function ReportsScreen() {
  const { colors } = useTheme();
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
        <Text style={s.pageTitle} accessibilityRole="header">
          Relatórios
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.tag} style={s.section}>
            {/* Em maiúsculas, o leitor poderia soletrar; o rótulo faz ele ler a palavra. */}
            <Text
              style={s.sectionLabel}
              accessibilityRole="header"
              accessibilityLabel={section.tag}
            >
              {section.tag.toUpperCase()}
            </Text>

            <View style={s.cardList}>
              {section.items.map((report, index) => (
                <TouchableOpacity
                  key={report.id}
                  style={[
                    s.card,
                    index === section.items.length - 1 && s.cardLast,
                  ]}
                  onPress={() =>
                    navigate(Screen.ReportView, { type: report.type })
                  }
                  activeOpacity={0.65}
                  accessibilityRole="button"
                >
                  <View
                    style={[s.cardAccent, { backgroundColor: colors[report.accent] }]}
                  />
                  <View style={s.cardBody}>
                    <Text style={s.cardTitle}>{report.title}</Text>
                    <Text style={s.cardSubtitle}>{report.subtitle}</Text>
                  </View>
                  <Text style={s.cardArrow} {...HIDDEN_FROM_SCREEN_READER}>
                    ›
                  </Text>
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
      backgroundColor: colors.THIRD_BACKGROUND,
      marginBottom: APP_BAR_HEIGHT,
    },
    content: {
      paddingHorizontal: SPACING[16],
      paddingTop: SPACING[28],
      paddingBottom: SPACING[40],
      gap: SPACING[28],
    },
    pageTitle: {
      fontSize: FONT_SIZE.HEADLINE,
      fontWeight: FONT_WEIGHT.BOLD,
      color: colors.TEXT_PRIMARY,
      letterSpacing: LETTER_SPACINGS.TIGHT,
    },
    section: {
      gap: SPACING[8],
    },
    sectionLabel: {
      fontSize: FONT_SIZE.OVERLINE,
      fontWeight: FONT_WEIGHT.BOLD,
      letterSpacing: LETTER_SPACINGS.LABEL_LG,
      color: colors.TEXT_MUTED,
      marginLeft: SPACING[2],
    },
    cardList: {
      borderRadius: RADIUS[12],
      borderWidth: 1,
      borderColor: colors.BORDER_STRONG,
      overflow: "hidden",
      backgroundColor: colors.THIRD_BACKGROUND,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: SPACING[14],
      paddingRight: SPACING[16],
      borderBottomWidth: 1,
      borderBottomColor: colors.BORDER_STRONG,
      gap: SPACING[12],
    },
    cardLast: {
      borderBottomWidth: 0,
    },
    cardAccent: {
      width: 3,
      height: 36,
      borderRadius: RADIUS.PILL,
      marginLeft: SPACING[14],
    },
    cardBody: {
      flex: 1,
      gap: SPACING[2],
    },
    cardTitle: {
      fontSize: FONT_SIZE.BODY,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
      color: colors.TEXT_PRIMARY,
    },
    cardSubtitle: {
      fontSize: FONT_SIZE.SMALL,
      color: colors.TEXT_MUTED,
    },
    cardArrow: {
      fontSize: FONT_SIZE.TITLE,
      color: colors.TEXT_MUTED,
      fontWeight: FONT_WEIGHT.LIGHT,
      lineHeight: LINE_HEIGHTS[22],
    },
  });
