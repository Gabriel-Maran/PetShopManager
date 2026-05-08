import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { initDatabase } from "./app/config/database";
import { COLORS, STATUS_BAR_HEIGHT, Screen } from "./app/config/consts";
import { useScreen } from "./app/hooks/useScreen";
import AppBar from "./app/view/components/AppBarra/AppBar";
import Home from "./app/view/pages/Home";
import Cadastros from "./app/view/pages/Cadastros";
import Relatorios from "./app/view/pages/Relatorios";
import NewOrEditOwner from "./app/view/pages/Owner/NewOrEditOwner";
import { ErrorProvider } from "./app/view/components/Error/ErrorProvider";
import NewOrEditPet from "./app/view/pages/Pet/NewOrEditPet";
import NewOrEditAppointment from "./app/view/pages/Appointments/NewOrEditAppointment";
import { Pet } from "./app/model/Pet";
import { Owner } from "./app/model/Owner";

function AppContent() {
  const { screen, params } = useScreen();

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
    default:
      return <Home />;
  }
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => setReady(true))
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTxt}>Erro ao iniciar banco: {error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY_VARIANT} />
      </View>
    );
  }

  return (
    <ErrorProvider>
      <View style={{ paddingTop: STATUS_BAR_HEIGHT, flex: 1 }}>
        <AppContent />
      </View>
    </ErrorProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTxt: {
    color: "red",
  },
});
