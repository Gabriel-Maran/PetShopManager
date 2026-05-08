import { StyleSheet, Text, View } from "react-native";
import ButtonBack from "./Botões/ButtonBack";
import { COLORS, Screen } from "../../../config/consts";

export default function TitleBar({
  title,
  subtitle,
  returnTo,
}: {
  title: string;
  subtitle: string;
  returnTo: Screen;
}) {
  return (
    <View style={styles.container}>
      <ButtonBack backTo={returnTo} />
      <View>
        <Text style={styles.txtTitle}>{title}</Text>
        <Text style={styles.txtSubTitle}>{subtitle}</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.THIRD_BACKGROUND,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: COLORS.BORDER_MID,
    padding: 20,
    alignItems: "center",
    gap: 15,
  },
  txtTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
  },
  txtSubTitle: {
    fontSize: 14,
    color: COLORS.TEXT_MUTED,
  },
});
