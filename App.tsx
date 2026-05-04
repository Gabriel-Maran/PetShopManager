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
        <ActivityIndicator size="large" color="#1D9E75" />
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
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  errorTxt: {
    color: "red",
  },
});
