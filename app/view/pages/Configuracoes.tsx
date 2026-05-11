import { StyleSheet, Text, View, ScrollView } from "react-native";
import DefaultHeader from "../components/Header/DefaultHeader";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../Themes/ThemeProvider";
import ThemeToggle from "../components/ThemeToggle";
import { DatabaseTransfer } from "../components/DatabaseTransfer";
import { useScreen } from "../../hooks/useScreen";
import { Screen } from "../../config/consts";

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
        <Text style={s.sectionLabel}>Aparência</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowText}>
              <Text style={s.rowTitle}>Modo de exibição</Text>
              <Text style={s.rowSubtitle}>Alterne entre claro e escuro</Text>
            </View>
            <ThemeToggle />
          </View>
        </View>
        <Text style={s.sectionLabel}>Dados</Text>
        <View style={s.card}>
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
    },
    scroll: {
      paddingHorizontal: 16,
      paddingBottom: 32,
      gap: 8,
    },

    // Section
    sectionLabel: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.2,
      color: colors.TEXT_PRIMARY,
      opacity: 0.45,
      marginTop: 24,
      marginBottom: 4,
      marginLeft: 4,
    },

    // Card
    card: {
      backgroundColor: colors.BACKGROUND, // ou SECOND_BACKGROUND — ajuste ao seu tema
      borderRadius: 16,
      overflow: "hidden",
      // sombra sutil
      shadowColor: "#000",
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
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowText: {
      flex: 1,
      marginRight: 12,
    },
    rowTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.TEXT_PRIMARY,
    },
    rowSubtitle: {
      fontSize: 12,
      color: colors.TEXT_PRIMARY,
      opacity: 0.5,
      marginTop: 2,
    },
  });
