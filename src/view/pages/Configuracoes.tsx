import { StyleSheet, Text, View, ScrollView } from "react-native";
import DefaultHeader from "../components/Header/DefaultHeader";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../Themes/ThemeProvider";
import ThemeToggle from "../components/ThemeToggle";
import { DatabaseTransfer } from "../components/DatabaseTransfer";
import { DemoDataLoader } from "../components/DemoDataLoader";
import { useScreen } from "../../hooks/useScreen";
import { APP_BAR_HEIGHT, Screen } from "../../config/consts";
import {
  FONT_SIZE,
  FONT_WEIGHT,
  LETTER_SPACINGS,
  RADIUS,
  SPACING,
} from "../Themes/tokens";

export default function Configuracoes() {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  const { navigate } = useScreen();

  return (
    <View style={[s.root, { backgroundColor: colors.THIRD_BACKGROUND }]}>
      <DefaultHeader />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.sectionLabel} accessibilityRole="header">
          Aparência
        </Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowText}>
              <Text style={s.rowTitle}>Modo de exibição</Text>
              <Text style={s.rowSubtitle}>Alterne entre claro e escuro</Text>
            </View>
            <ThemeToggle />
          </View>
        </View>
        <Text style={s.sectionLabel} accessibilityRole="header">
          Dados
        </Text>
        <View style={s.card}>
          <DemoDataLoader onLoaded={() => navigate(Screen.Calendario)} />
          <DatabaseTransfer
            onImportSuccess={() => navigate(Screen.Calendario)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      marginBottom: APP_BAR_HEIGHT,
    },
    scroll: {
      paddingHorizontal: SPACING[16],
      paddingBottom: SPACING[32],
      gap: SPACING[8],
    },

    // Section
    // Os textos de apoio usam TEXT_MUTED em vez de opacidade, que deixava o contraste abaixo de 4,5:1.
    sectionLabel: {
      fontSize: FONT_SIZE.CAPTION,
      fontWeight: FONT_WEIGHT.BOLD,
      letterSpacing: LETTER_SPACINGS.LABEL,
      color: colors.TEXT_MUTED,
      marginTop: SPACING[24],
      marginBottom: SPACING[4],
      marginLeft: SPACING[4],
    },

    // Card
    card: {
      backgroundColor: colors.BACKGROUND,
      borderRadius: RADIUS[16],
      overflow: "hidden",
      // sombra sutil
      shadowColor: colors.SHADOW,
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },

    // Row (modo de exibição)
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SPACING[16],
      paddingVertical: SPACING[14],
    },
    rowText: {
      flex: 1,
      marginRight: SPACING[12],
    },
    rowTitle: {
      fontSize: FONT_SIZE.BODY_LARGE,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
      color: colors.TEXT_PRIMARY,
    },
    rowSubtitle: {
      fontSize: FONT_SIZE.SMALL,
      color: colors.TEXT_MUTED,
      marginTop: SPACING[2],
    },
  });
