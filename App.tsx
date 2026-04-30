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
import { STATUS_BAR_HEIGHT } from "./app/config/consts";
import { Screen } from "./app/config/consts";
import { useScreen } from "./app/hooks/useScreen";
import BarraDePesquisa from "./app/view/components/BarraDePesquisa";

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
            <BarraDePesquisa />
          </>
        );
      case Screen.Cadastros:
        return (
          <>
            <View>
              <Text>Cadastros</Text>
            </View>
            <BarraDePesquisa />
          </>
        );
      case Screen.Relatorios:
        return (
          <>
            <View>
              <Text>Relatórios</Text>
            </View>
            <BarraDePesquisa />
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
