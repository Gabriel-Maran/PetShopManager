import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useState, ReactNode } from "react";

import { initDatabase } from "./app/config/database";
import {
  RelatorioParams,
  RelatorioType,
  STATUS_BAR_HEIGHT,
  Screen,
} from "./app/config/consts";
import { useScreen } from "./app/hooks/useScreen";

import {
  ThemeColors,
  ThemeProvider,
  useTheme,
  useThemedStyles,
} from "./app/view/Themes/ThemeProvider";

import { ErrorProvider } from "./app/view/components/Error/ErrorProvider";
import AppBar from "./app/view/components/AppBarra/AppBar";

import Home from "./app/view/pages/Home";
import Cadastros from "./app/view/pages/Cadastros";
import Relatorios from "./app/view/pages/Relatorios";
import NewOrEditOwner from "./app/view/pages/Owner/NewOrEditOwner";
import NewOrEditPet from "./app/view/pages/Pet/NewOrEditPet";
import NewOrEditAppointment from "./app/view/pages/Appointments/NewOrEditAppointment";
import Configuracoes from "./app/view/pages/Configuracoes";
import { AgendamentosProvider } from "./app/view/contexts/agendamentos";
import RelatorioView from "./app/view/pages/Relatorios/Render/RelatorioView";

function AppContent() {
  const { screen } = useScreen();
  const { params } = useScreen<RelatorioParams>();

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
      {(screen == Screen.Calendario ||
        screen == Screen.Cadastros ||
        screen == Screen.Relatorios ||
        screen == Screen.Configuracoes) && <AppBar />}
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
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <View style={s.container}>
        <Text style={s.errorTxt}>Erro ao iniciar banco: {error}</Text>
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
      <StatusBar
        backgroundColor={colors.BACKGROUND}
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent={false}
      />
      <View style={{ paddingTop: STATUS_BAR_HEIGHT, flex: 1 }}>
        <AppContent />
      </View>
    </View>
  );
}

// ✅ App só monta os providers — sem hooks de tema aqui
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
