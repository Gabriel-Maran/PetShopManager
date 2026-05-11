import { Button, Text, View } from "react-native";
import { RelatorioType, Screen } from "../../../config/consts";
import { useScreen } from "../../../hooks/useScreen";
import { useTheme } from "../../Themes/ThemeProvider";

export default function RelatorioView({ route }: { route: RelatorioType }) {
  const { navigate } = useScreen();
  const { colors } = useTheme();
  return (
    <>
      <View>
        <Button onPress={() => navigate(Screen.Relatorios)} title="VOLTAR" />
        <Text style={{ color: colors.TEXT_PRIMARY }}>
          {RelatorioType[route]}
        </Text>
      </View>
    </>
  );
}
