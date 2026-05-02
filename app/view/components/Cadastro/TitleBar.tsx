import { StyleSheet, Text, View } from "react-native";
import ButtonBack from "./Botões/ButtonBack";
import { Screen } from "../../../config/consts";

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
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    padding: 20,
    alignItems: "center",
    gap: 15,
  },
  txtTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  txtSubTitle: {
    fontSize: 14,
    color: "#777777",
  },
});
