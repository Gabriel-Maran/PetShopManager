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
  RelatorioParams,
  RelatorioType,
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
} from "./src/view/Themes/ThemeProvider";

import { ErrorProvider } from "./src/view/components/Error/ErrorProvider";
import AppBar from "./src/view/components/AppBarra/AppBar";

import Home from "./src/view/pages/Home";
import Cadastros from "./src/view/pages/Cadastros";
import Relatorios from "./src/view/pages/Relatorios";
import NewOrEditOwner from "./src/view/pages/Owner/NewOrEditOwner";
import NewOrEditPet from "./src/view/pages/Pet/NewOrEditPet";
import NewOrEditAppointment from "./src/view/pages/Appointments/NewOrEditAppointment";
import Configuracoes from "./src/view/pages/Configuracoes";
import { AgendamentosProvider } from "./src/view/contexts/agendamentos";
import RelatorioView from "./src/view/pages/Relatorios/Render/RelatorioView";

function AppContent() {
  const { screen, params } = useScreen<RelatorioParams>();
  useAndroidBackButton();

  let content: ReactNode;

  switch (screen) {
    case Screen.Calendario:
      content = <Home />;
      break;

    case Screen.Cadastros:
      content = <Cadastros />;
      break;

    case Screen.Relatorios:
      content = <Relatorios />;
      break;

    case Screen.Configuracoes:
      content = <Configuracoes />;
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

    case Screen.RelatorioView:
      content = (
        <RelatorioView
          route={params?.type ?? RelatorioType.ComparativoMensal}
        />
      );
      break;

    default:
      content = <Home />;
      break;
  }
  return (
    <>
      <AgendamentosProvider>{content}</AgendamentosProvider>
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
