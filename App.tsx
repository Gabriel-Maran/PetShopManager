import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { initDatabase } from './app/config/database';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => setReady(true))
      .catch(e => setError(e.message));
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red' }}>Erro ao iniciar banco: {error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // banco pronto — aqui será feita a navegação do app
  return (
    <View style={styles.container}>
      <Text>Pet Shop Manager</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});