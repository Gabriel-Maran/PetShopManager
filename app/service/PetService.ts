import { petRepository } from "../repository/PetRepository";
import type { PetData, PetRemarcacaoData } from "../validation/petSchema";
import type { NameSearchData } from "../validation/searchSchema";

class PetService {
  getPetById(id: number) {
    return petRepository.getPetById(id);
  }

  getAllPets() {
    return petRepository.getAllPets();
  }

  searchPetsPage(search: NameSearchData) {
    return petRepository.searchPetsPage(search);
  }

  getPetsByOwnerId(ownerId: number) {
    return petRepository.getPetsByOwnerId(ownerId);
  }

  createPet(pet: PetData) {
    return petRepository.createPet(pet);
  }

  updatePet(id: number, pet: PetData) {
    return petRepository.updatePet(id, pet);
  }

  updateRemarcacao(id: number, remarcacao: PetRemarcacaoData) {
    return petRepository.updateRemarcacao(
      id,
      remarcacao.remarcacao_ativa,
      remarcacao.pacote_remarcacao,
      remarcacao.data_inicio_pacote,
      remarcacao.valor_pacote,
    );
  }

  deactivatePet(id: number) {
    return petRepository.deactivatePet(id);
  }

  activatePet(id: number) {
    return petRepository.activatePet(id);
  }
}

export const petService = new PetService();
