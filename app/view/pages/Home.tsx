import { View, Text, StyleSheet, Image } from "react-native";
import Calendario from "../components/Calendario";
import Agendamentos from "../components/Agendamentos";
import { useState } from "react";

export default function Home() {
  const [isAgenFullScreen, setIsAgenFullScreen] = useState(false);
  return (
    <View style={styles.container}>
      <View style={{ backgroundColor: "#fff", paddingBottom: 10 }}>
        <Image
          source={require("../../assets/logoPetShopFundoBranco.png")}
          style={{ width: 180, height: 50, alignSelf: "center" }}
        />
      </View>
      <View style={{ flex: 1, padding: 15, backgroundColor: "#F2F3F7" }}>
        {!isAgenFullScreen && <Calendario />}
        <Agendamentos
          margemSuperior={10}
          setFullScreen={setIsAgenFullScreen}
          isFullScreen={isAgenFullScreen}
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
