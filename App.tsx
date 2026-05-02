import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { initDatabase } from "./app/config/database";
import { STATUS_BAR_HEIGHT } from "./app/config/consts";
import { Screen } from "./app/config/consts";
import { useScreen } from "./app/hooks/useScreen";
import AppBar from "./app/view/components/AppBarra/AppBar";
import Home from "./app/view/pages/Home";
import Cadastros from "./app/view/pages/Cadastros";
import Relatorios from "./app/view/pages/Relatorios";

export default function App() {
  // Estado para controlar se o banco de dados está pronto
  const [ready, setReady] = useState(false);

  // Estado para controlar erros na inicialização do banco
  const [error, setError] = useState<string | null>(null);

  // Estado para controlar a tela atual
  const { screen, navigate } = useScreen();

  // Função para renderizar a tela atual com base no estado currentScreen
  const renderScreen = () => {
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
