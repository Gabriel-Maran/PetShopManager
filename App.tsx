import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { initDatabase } from "./app/config/database";
import { STATUS_BAR_HEIGHT, Screen } from "./app/config/consts";
import { useScreen } from "./app/hooks/useScreen";
import AppBar from "./app/view/components/AppBarra/AppBar";
import Home from "./app/view/pages/Home";
import Cadastros from "./app/view/pages/Cadastros";
import Relatorios from "./app/view/pages/Relatorios";
import NewOrEditOwner from "./app/view/pages/Owner/NewOrEditOwner";
import { ErrorProvider } from "./app/view/components/Error/ErrorProvider";
import NewOrEditPet from "./app/view/pages/Pet/NewOrEditPet";
import NewOrEditAppointment from "./app/view/pages/Appointments/NewOrEditAppointment";
import {
  ThemeColors,
  ThemeProvider,
  useTheme,
  useThemedStyles,
} from "./app/view/Themes/ThemeProvider";
import Configuracoes from "./app/view/pages/Configuracoes";

function AppContent() {
  const { screen } = useScreen();

  switch (screen) {
    case Screen.Calendario:
      return (
        <>
          <Home />
          <AppBar />
        </>
      );
    case Screen.Cadastros:
      return (
        <>
          <Cadastros />
          <AppBar />
        </>
      );
    case Screen.NewOrEditOwner:
      return <NewOrEditOwner />;
    case Screen.NewOrEditPet:
      return <NewOrEditPet />;
    case Screen.NewOrEditAppointment:
      return <NewOrEditAppointment />;
    case Screen.Relatorios:
      return (
        <>
          <Relatorios />
          <AppBar />
        </>
      );
    case Screen.Configuracoes:
      return (
        <>
          <Configuracoes />
          <AppBar />
        </>
      );
    default:
      return (
        <>
          <Home />
          <AppBar />
        </>
      );
  }
}

function AppInner() {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
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
    <View style={{ paddingTop: STATUS_BAR_HEIGHT, flex: 1 }}>
      <AppContent />
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
