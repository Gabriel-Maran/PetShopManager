import { View, StyleSheet } from "react-native";
import { useCallback, useState } from "react";
import AppointmentCalendar from "../components/AppointmentCalendar";
import AppointmentList from "../components/AppointmentList";
import DefaultHeader from "../components/header/DefaultHeader";
import { useBackGuard } from "../../hooks/useBackNavigation";
import { ThemeColors, useTheme, useThemedStyles } from "../theme/ThemeProvider";
import { SPACING } from "../theme/tokens";

export default function HomeScreen() {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();

  const [isAgendaFullScreen, setIsAgendaFullScreen] = useState(false);
  const collapseAgenda = useCallback(() => setIsAgendaFullScreen(false), []);

  // Com a agenda em tela cheia, o voltar do Android a recolhe antes de fechar o app.
  useBackGuard(isAgendaFullScreen ? collapseAgenda : null);

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
        {!isAgendaFullScreen && <AppointmentCalendar />}
        <AppointmentList
          topMargin={10}
          setFullScreen={setIsAgendaFullScreen}
          isFullScreen={isAgendaFullScreen}
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
