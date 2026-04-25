import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { initDatabase } from "./app/config/database";
import Home from "./app/view/pages/Home";

export const STATUS_BAR_HEIGHT =
  Platform.OS === "ios" ? 44 : (StatusBar.currentHeight ?? 24);

export const SEARCH_BAR_HEIGHT = 70;

export enum Screen {
  Home = "Home",
  OwnersList = "OwnersList",
  OwnerForm = "OwnerForm",
  PetsList = "PetsList",
  PetForm = "PetForm",
  AppointmentsList = "AppointmentsList",
  AppointmentForm = "AppointmentForm",
}

export default function App() {
  // Estado para controlar se o banco de dados está pronto
  const [ready, setReady] = useState(false);
  // Estado para controlar erros na inicialização do banco
  const [error, setError] = useState<string | null>(null);
  // Estado para controlar a tela atual
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.Home);
  // Função para renderizar a tela atual com base no estado currentScreen
  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.Home:
        return <Home />;
      case Screen.OwnersList:
        return <Text>Owners List</Text>;
      case Screen.OwnerForm:
        return <Text>Owner Form</Text>;
      case Screen.PetsList:
        return <Text>Pets List</Text>;
      case Screen.PetForm:
        return <Text>Pet Form</Text>;
      case Screen.AppointmentsList:
        return <Text>Appointments List</Text>;
      case Screen.AppointmentForm:
        return <Text>Appointment Form</Text>;
      default:
        return <Home />;
    }
  };

  useEffect(() => {
    initDatabase()
      .then(() => setReady(true))
      .catch((e) => setError(e.message));
  }, []);

  // Se der erro ao iniciar o banco, mostrar mensagem de erro
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "red" }}>Erro ao iniciar banco: {error}</Text>
      </View>
    );
  }

  // Se o banco ainda não estiver pronto, mostrar indicador de carregamento
  if (!ready) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ paddingTop: STATUS_BAR_HEIGHT, flex: 1 }}>
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
