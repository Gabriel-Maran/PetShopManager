import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Calendar from 'react-native-calendars/src/calendar';

export default function App() {
  const [selected, setSelected] = useState('');
  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <Calendar
      onDayPress={(day) => {
        setSelected(day.dateString); // ex: "2025-04-24"
      }}
      markedDates={{
        [selected]: {
          selected: true,
          selectedColor: '#378ADD',
        },
      }}
    />
      <StatusBar style="auto" />
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
