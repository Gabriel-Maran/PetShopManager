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
import { APP_BAR_HEIGHT } from "../../config/consts";

export default function Home() {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();

  const [isAgenFullScreen, setIsAgenFullScreen] = useState(false);

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

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.THIRD_BACKGROUND,
    },
  });
