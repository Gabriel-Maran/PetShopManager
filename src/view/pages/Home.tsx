import { View, StyleSheet } from "react-native";
import { useCallback, useState } from "react";
import Calendario from "../components/Calendario";
import Agendamentos from "../components/Agendamentos";
import DefaultHeader from "../components/Header/DefaultHeader";
import { useBackGuard } from "../../hooks/useBackNavigation";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../Themes/ThemeProvider";
import { SPACING } from "../Themes/tokens";

export default function Home() {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();

  const [isAgenFullScreen, setIsAgenFullScreen] = useState(false);
  const collapseAgenda = useCallback(() => setIsAgenFullScreen(false), []);

  // Com a agenda em tela cheia, o voltar do Android a recolhe antes de fechar o app.
  useBackGuard(isAgenFullScreen ? collapseAgenda : null);

  return (
    <View style={s.container}>
      <DefaultHeader />
      <View
        style={{
          flex: 1,
          padding: SPACING[15],
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
