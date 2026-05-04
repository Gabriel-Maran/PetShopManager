import { StyleSheet, Text } from "react-native";
import { Screen } from "../../../config/consts";
import DefaultHeader from "../../components/Header/DefaultHeader";
import { Button } from "react-native";
import { useState } from "react";
import { Pet } from "../../../model/Pet";
import { petController } from "../../../controller/PetController";

export default function NewOrEditPet({ petToEdit }: { petToEdit?: Pet }) {
  const [nome, setNome] = useState(petToEdit?.nome ?? "");
  const [especie, setEspecie] = useState(petToEdit?.especie ?? "");
  const [raca, setRaca] = useState(petToEdit?.raca ?? "");
  const [observacoes, setObservacoes] = useState(petToEdit?.observacoes ?? "");
  const [dono_id, setDonoId] = useState(petToEdit?.dono_id ?? 0);

  /* const salvarPet = async () => {
    try {
      await petController.createPet(
        nome,
        especie,
        dono_id,
        raca,
        observacoes,
      );
    } catch (erro) {

    } */

  const salvarPet = async () => {
    setNome("Teste");
    setEspecie("Cachorro");
    setRaca("Labrador");
    setObservacoes("Nenhuma");
    setDonoId(1);

    try {
      await petController.createPet(nome, especie, dono_id, raca, observacoes);
    } catch (erro) {}

    return (
      <>
        <DefaultHeader screenBack={Screen.Cadastros} />
        <Text>Create Or Edit Pet</Text>

        <Button
          onPress={() => {
            salvarPet();
          }}
          title="Salvar"
        />
      </>
    );
  };
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
