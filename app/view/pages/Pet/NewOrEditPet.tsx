import { Button, StyleSheet, Text } from "react-native";
import { PacoteRemarcacao, Screen, TipoServico } from "../../../config/consts";
import DefaultHeader from "../../components/Header/DefaultHeader";
import { useState } from "react";
import { Pet } from "../../../model/Pet";
import { petController } from "../../../controller/PetController";
import { useError } from "../../../hooks/useError";

export default function NewOrEditPet({ petToEdit }: { petToEdit?: Pet }) {
  const { showError } = useError();
  const [nome, setNome] = useState(petToEdit?.nome ?? "");
  const [especie, setEspecie] = useState(petToEdit?.especie ?? "");
  const [dono_id, setDonoId] = useState(petToEdit?.dono_id ?? 0);
  const [raca, setRaca] = useState(petToEdit?.raca ?? "");
  const [observacoes, setObservacoes] = useState(petToEdit?.observacoes ?? "");
  const [servicoPadrao, setServicoPadrao] = useState<TipoServico>(
    petToEdit?.servico_padrao ?? TipoServico.Banho,
  );
  const [remarcAtiva, setRemarcAtiva] = useState(
    petToEdit?.remarcacao_ativa ?? false,
  );
  const [remarcGapDias, setRemarcGapDias] = useState<
    PacoteRemarcacao | undefined
  >(
    petToEdit?.remarcacao_gap_dias &&
      petToEdit.remarcacao_gap_dias in PacoteRemarcacao
      ? (petToEdit.remarcacao_gap_dias as PacoteRemarcacao)
      : undefined,
  );

  /*
    nome: string,
    especie: string,
    dono_id: number,
    raca?: string,
    observacoes?: string,
    servico_padrao: TipoServico = TipoServico.Banho, // Valor padrão caso não venha nada
    remarcacao_ativa: number = 0, // 0 para desligado
    remarcacao_gap_dias?: PacoteRemarcacao,
    */

  const salvarPet = async () => {
    //Teste
    setNome("Teste");
    setEspecie("Cachorro");
    setRaca("Labrador");
    setObservacoes("Nenhuma");
    setDonoId(1);
    try {
      await petController.createPet(
        nome,
        especie,
        dono_id,
        raca,
        observacoes,
        servicoPadrao,
        remarcAtiva ? 1 : 0,
        remarcGapDias,
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
