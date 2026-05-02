import { StyleSheet, Text } from "react-native";
import { Screen } from "../../../config/consts";
import DefaultHeader from "../../components/Header/DefaultHeader";

export default function NewOrEditPet() {
  return (
    <>
      <DefaultHeader screenBack={Screen.Cadastros} />
      <Text>Create Or Edit Pet</Text>
    </>
  );
}

const styles = StyleSheet.create({
  calendar: {
    width: "100%",
  },
  completeCalendar: {
    backgroundColor: "#fff",
    width: "100%",
    justifyContent: "center",
    alignSelf: "center",
    padding: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 15,
  },
});
