import { Button, Text } from "react-native";
import { useState } from "react";
import {
  PacoteRemarcacao,
  PorteAnimal,
  Screen,
  TipoServico,
} from "../../../config/consts";
import DefaultHeader from "../../components/Header/DefaultHeader";
import { Pet } from "../../../model/Pet";
import { petController } from "../../../controller/PetController";
import { useError } from "../../../hooks/useError";

export default function NewOrEditPet({ petToEdit }: { petToEdit?: Pet }) {
  const { showError } = useError();

  const [form, setForm] = useState({
    nome: petToEdit?.nome ?? "",
    especie: petToEdit?.especie ?? "",
    dono_id: petToEdit?.dono_id ?? 0,
    raca: petToEdit?.raca ?? "",
    observacoes: petToEdit?.observacoes ?? "",
    servicoPadrao: petToEdit?.servico_padrao ?? TipoServico.Banho,
    remarcAtiva: petToEdit?.remarcacao_ativa ?? false,
    porte:
      petToEdit?.porte && petToEdit.porte in PorteAnimal
        ? (petToEdit.porte as PorteAnimal)
        : PorteAnimal.MEDIO,
    remarcGapDias:
      petToEdit?.remarcacao_gap_dias &&
      petToEdit.remarcacao_gap_dias in PacoteRemarcacao
        ? (petToEdit.remarcacao_gap_dias as PacoteRemarcacao)
        : undefined,
  });

  const salvarPet = async () => {
    try {
      await petController.createPet(
        form.nome,
        form.especie,
        form.porte,
        form.dono_id,
        form.raca,
        form.observacoes,
        form.servicoPadrao,
        form.remarcAtiva ? 1 : 0,
        form.remarcGapDias,
      );
    } catch (erro) {
      showError(erro instanceof Error ? erro.message : "Erro inesperado.");
    }
  };

  return (
    <>
      <DefaultHeader screenBack={Screen.Cadastros} />
      <Text>Create Or Edit Pet</Text>
      <Button onPress={salvarPet} title="Salvar" />
    </>
  );
}
