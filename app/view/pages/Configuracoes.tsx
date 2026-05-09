import { Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../Themes/ThemeProvider";
import DefaultHeader from "../components/Header/DefaultHeader";

export default function Configuracoes() {
  const { colors, isDark, trocarTheme } = useTheme();
  return (
    <View style={{ backgroundColor: colors.THIRD_BACKGROUND, flex: 1 }}>
      <DefaultHeader />
      <TouchableOpacity onPress={trocarTheme}>
        <Text style={{ color: colors.TEXT_PRIMARY }}>Troque o modo</Text>
        <Text style={{ color: colors.TEXT_PRIMARY }}>
          {isDark ? "🌙 Tema escuro" : "☀️ Tema claro"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
