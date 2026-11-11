import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useState, ReactNode } from "react";

import {
  createNavigationContainerRef,
  DefaultTheme,
  NavigationContainer,
  type ParamListBase,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { initDatabase } from "./src/config/database";
import { logError, toUserMessage } from "./src/errors/AppError";
import { MESSAGES } from "./src/globals/messages";
import { STATUS_BAR_HEIGHT } from "./src/config/consts";
import { HOME_SCREEN, isTabScreen, Screen } from "./src/config/navigation";

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

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef<ParamListBase>();

const SCREENS: Record<Screen, () => ReactNode> = {
  [Screen.Calendar]: HomeScreen,
  [Screen.Registry]: RegistryScreen,
  [Screen.Reports]: ReportsScreen,
  [Screen.Settings]: SettingsScreen,
  [Screen.NewOrEditOwner]: NewOrEditOwner,
  [Screen.NewOrEditPet]: NewOrEditPet,
  [Screen.NewOrEditAppointment]: NewOrEditAppointment,
  [Screen.ReportView]: ReportView,
};

function AppContent() {
  const { colors } = useTheme();
  const [screen, setScreen] = useState<Screen>(HOME_SCREEN);
  const theme = useMemo(
    () => ({ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.BACKGROUND } }),
    [colors.BACKGROUND],
  );

  return (
    <CalendarProvider>
      <NavigationContainer
        ref={navigationRef}
        theme={theme}
        onStateChange={() => {
          const current = navigationRef.getCurrentRoute()?.name as Screen | undefined;
          if (current) setScreen(current);
        }}
      >
        {/* Cabeçalhos próprios; sem gesto de voltar, para a confirmação dos formulários valer sempre. */}
        <Stack.Navigator
          initialRouteName={HOME_SCREEN}
          screenOptions={{ headerShown: false, gestureEnabled: false, animation: "fade" }}
        >
          {Object.entries(SCREENS).map(([name, component]) => (
            <Stack.Screen key={name} name={name} component={component} />
          ))}
        </Stack.Navigator>
        {isTabScreen(screen) && <AppBar current={screen} navigator={navigationRef} />}
      </NavigationContainer>
    </CalendarProvider>
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
