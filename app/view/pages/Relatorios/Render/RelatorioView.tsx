import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  PorteAnimal,
  RelatorioType,
  Screen,
  TipoServico,
} from "../../../../config/consts";
import ComparativoMensal from "../ComparativoMensal";
import DiasHorasMaisAtendidas from "../DiasHorasMaisAtendidas";
import OrigemAgendamentos from "../OrigemAgendamentos";
import PetsAusentes from "../PetsAusentes";
import RemarcacoesIntervals from "../RemarcacoesIntervals";
import { PetBuilder } from "../../../../model/Pet";
import { petController } from "../../../../controller/PetController";
import { ownerController } from "../../../../controller/OwnerController";
import { useCallback } from "react";
import TitleBar from "../../../components/Cadastro/TitleBar";
import { getDatabase } from "../../../../config/database";

export default function RelatorioView({ route }: { route: RelatorioType }) {
  // Função extraída para limpar o bloco do switch
  const handleCreateMockPet = useCallback(async () => {
    try {
      const dono = await ownerController.getOwnerById(1);
      console.log(dono);
      const mockPetBuilder = new PetBuilder()
        .withNome("Thor03")
        .forDono(1)
        .withEspecie(1)
        .withPorte(PorteAnimal.MEDIO)
        .withRaca(1)
        .withServicoPadrao(TipoServico.BanhoETosa)
        .isRemarcacaoAtiva(1)
        .withPacote(2)
        .withInicioPacote(20260501)
        .withObservacoes("Alérgico a shampoo de coco. Muito dócil.")
        .is_ativo(1)
        .build();
      console.log(mockPetBuilder);
      await petController.createPet(mockPetBuilder);
      Alert.alert("Sucesso", "Pet de teste criado com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível criar o pet de teste." + error);
      console.log(error);
    }
  }, []);

  const handleDesativar = useCallback(async () => {
    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE pets 
              SET 
                  remarcacao_ativa = 0, 
                  data_inicio_pacote = NULL, 
                  pacote_remarcacao = NULL;
             `,
      );
    } catch (error) {
      Alert.alert("Erro", "Não foi possível criar o pet de teste." + error);
      console.log(error);
    }
  }, []);

  const handleReativar = useCallback(async () => {
    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE pets 
              SET 
                  remarcacao_ativa = 1, 
                  data_inicio_pacote = 20260514, 
                  pacote_remarcacao = 2;
             `,
      );
    } catch (error) {
      Alert.alert("Erro", "Não foi possível criar o pet de teste." + error);
      console.log(error);
    }
  }, []);

  switch (route) {
    case RelatorioType.DiasHorasMovimentados:
      return <DiasHorasMaisAtendidas />;
    case RelatorioType.OrigemAgendamentos:
      return <OrigemAgendamentos />;
    case RelatorioType.PetsAusentes:
      return <PetsAusentes />;
    case RelatorioType.Remarcacoes:
      return <RemarcacoesIntervals />;
    case RelatorioType.ComparativoMensal:
      return <ComparativoMensal />;
    case RelatorioType.Pacotes:
      return (
        <>
          <TitleBar
            returnTo={Screen.Relatorios}
            title="TESTE"
            subtitle="TESTE"
          />
          <View style={styles.container}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleCreateMockPet}
            >
              <Text style={styles.buttonText}>TESTAR CRIAÇÃO DE PET</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleDesativar}>
              <Text style={styles.buttonText}>TESTAR DESATIVAR DE PETS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleReativar}>
              <Text style={styles.buttonText}>TESTAR ATIVAR DE PETS</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    default:
      return <DiasHorasMaisAtendidas />;
  }
}

// Centralização de estilos com StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});
