import { View, StyleSheet } from "react-native";
import Calendario from "../components/Calendario";
import Agendamentos from "../components/Agendamentos";
import { useState } from "react";
import DefaultHeader from "../components/Header/DefaultHeader";

export default function Home() {
  const [isAgenFullScreen, setIsAgenFullScreen] = useState(false);
  const [dateSelected, setDateSelected] = useState(
    new Date().toISOString().split("T")[0],
  );
  return (
    <View style={styles.container}>
      <DefaultHeader />
      <View style={{ flex: 1, padding: 15, backgroundColor: "#F2F3F7" }}>
        {!isAgenFullScreen && (
          <Calendario
            setNewDate={setDateSelected}
            dateSelected={dateSelected}
          />
        )}
        <Agendamentos
          margemSuperior={10}
          setFullScreen={setIsAgenFullScreen}
          isFullScreen={isAgenFullScreen}
          dateSelected={dateSelected}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
