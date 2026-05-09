import { View, StyleSheet } from "react-native";
import Calendario from "../components/Calendario";
import Agendamentos from "../components/Agendamentos";
import { useState } from "react";
import DefaultHeader from "../components/Header/DefaultHeader";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../Themes/ThemeProvider";

export default function Home() {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();

  const [isAgenFullScreen, setIsAgenFullScreen] = useState(false);
  const [dateSelected, setDateSelected] = useState(
    new Date().toISOString().split("T")[0],
  );
  return (
    <View style={s.container}>
      <DefaultHeader />
      <View
        style={{
          flex: 1,
          padding: 15,
          backgroundColor: colors.THIRD_BACKGROUND,
        }}
      >
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

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.THIRD_BACKGROUND,
    },
  });
