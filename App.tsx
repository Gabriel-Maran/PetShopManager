import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useState, ReactNode } from "react";

import { initDatabase } from "./src/config/database";
import { logError, toUserMessage } from "./src/errors/AppError";
import { MESSAGES } from "./src/globals/messages";
import {
  ReportParams,
  ReportType,
  STATUS_BAR_HEIGHT,
  Screen,
} from "./src/config/consts";
import { isTabScreen } from "./src/config/navigation";
import { useScreen } from "./src/hooks/useScreen";
import { useAndroidBackButton } from "./src/hooks/useBackNavigation";

import {
  ThemeColors,
  ThemeProvider,
  useTheme,
  useThemedStyles,
} from "./src/view/theme/ThemeProvider";

import { ErrorProvider } from "./src/view/components/error/ErrorProvider";
import AppBar from "./src/view/components/appBar/AppBar";

import HomeScreen from "./src/view/pages/HomeScreen";
import RegistryScreen from "./src/view/pages/RegistryScreen";
import ReportsScreen from "./src/view/pages/ReportsScreen";
import NewOrEditOwner from "./src/view/pages/owner/NewOrEditOwner";
import NewOrEditPet from "./src/view/pages/pet/NewOrEditPet";
import NewOrEditAppointment from "./src/view/pages/appointments/NewOrEditAppointment";
import SettingsScreen from "./src/view/pages/SettingsScreen";
import { CalendarProvider } from "./src/view/contexts/CalendarContext";
import ReportView from "./src/view/pages/reports/ReportView";

function AppContent() {
  const { screen, params } = useScreen<ReportParams>();
  useAndroidBackButton();

  let content: ReactNode;

  switch (screen) {
    case Screen.Calendar:
      content = <HomeScreen />;
      break;

    case Screen.Registry:
      content = <RegistryScreen />;
      break;

    case Screen.Reports:
      content = <ReportsScreen />;
      break;

    case Screen.Settings:
      content = <SettingsScreen />;
      break;

    case Screen.NewOrEditOwner:
      content = <NewOrEditOwner />;
      break;

    case Screen.NewOrEditPet:
      content = <NewOrEditPet />;
      break;

    case Screen.NewOrEditAppointment:
      content = <NewOrEditAppointment />;
      break;

    case Screen.ReportView:
      content = (
        <ReportView
          route={params?.type ?? ReportType.MonthlyComparison}
        />
      );
      break;

    default:
      content = <HomeScreen />;
      break;
  }
  return (
    <>
      <CalendarProvider>{content}</CalendarProvider>
      {isTabScreen(screen) && <AppBar />}
    </>
  );
}

function AppInner() {
  const s = useThemedStyles(styles);
  const { isDark, colors } = useTheme();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => setReady(true))
      .catch((e: unknown) => {
        logError(e, "abertura do banco");
        setError(toUserMessage(e, MESSAGES.database.openFailed));
      });
  }, []);

  if (error) {
    return (
      <View style={s.container}>
        <Text style={s.errorTxt}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={s.container}>
        <ActivityIndicator size="large" color={colors.PRIMARY_VARIANT} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.BACKGROUND }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={{ paddingTop: STATUS_BAR_HEIGHT, flex: 1 }}>
        <AppContent />
      </View>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ErrorProvider>
        <AppInner />
      </ErrorProvider>
    </ThemeProvider>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.BACKGROUND,
      alignItems: "center",
      justifyContent: "center",
    },
    errorTxt: {
      color: "red",
    },
  });
