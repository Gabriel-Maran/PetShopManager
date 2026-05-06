import { Button, Text } from "react-native";
import { useState } from "react";
import {
  EspeciesAtendidas,
  PacoteRemarcacao,
  PorteAnimal,
  Screen,
  TipoServico,
} from "../../../config/consts";
import { useError } from "../../../hooks/useError";
import { Pet } from "../../../model/Pet";
import { petController } from "../../../controller/PetController";

import DefaultHeader from "../../components/Header/DefaultHeader";
import InputSelect from "../../components/InputSelect";

export default function NewOrEditPet({ petToEdit }: { petToEdit?: Pet }) {
  const { showError } = useError();

  const [form, setForm] = useState({
    nome: petToEdit?.nome ?? "",
    especie: petToEdit?.especie ?? EspeciesAtendidas.CAO,
    dono_id: petToEdit?.dono_id ?? 0,
    raca: petToEdit?.raca ?? "",
    observacoes: petToEdit?.observacoes ?? "",
    servicoPadrao: petToEdit?.servico_padrao ?? TipoServico.Banho,
    remarcAtiva: petToEdit?.remarcacao_ativa ?? false,
    porte:
      petToEdit?.porte && petToEdit.porte in PorteAnimal
        ? (petToEdit.porte as PorteAnimal)
        : PorteAnimal.MEDIO,
    pacoteRemarcacao:
      petToEdit?.pacote_remarcacao &&
      petToEdit.pacote_remarcacao in PacoteRemarcacao
        ? (petToEdit.pacote_remarcacao as PacoteRemarcacao)
        : undefined,
    dataInicioPacote: petToEdit?.data_inicio_pacote ?? undefined,
  });

  const salvarPet = async () => {
    try {
      if (petToEdit?.id) {
        await petController.updatePet(
          petToEdit.id,
          form.nome,
          form.especie,
          form.porte,
          form.dono_id,
          form.raca,
          form.observacoes,
          form.servicoPadrao,
          form.remarcAtiva ? 1 : 0,
          form.pacoteRemarcacao,
          form.dataInicioPacote,
        );
      } else {
        await petController.createPet(
          form.nome,
          form.especie,
          form.porte,
          form.dono_id,
          form.raca,
          form.observacoes,
          form.servicoPadrao,
          form.remarcAtiva ? 1 : 0,
          form.pacoteRemarcacao,
          form.dataInicioPacote,
        );
      }
    } catch (erro) {
      showError(erro instanceof Error ? erro.message : "Erro inesperado.");
    }
  };

  return (
    <>
      <DefaultHeader screenBack={Screen.Cadastros} />
      <Text>Create Or Edit Pet</Text>
      <Button onPress={salvarPet} title="Salvar" />
      <InputSelect />
    </>
  );
}
