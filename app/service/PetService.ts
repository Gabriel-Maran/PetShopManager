import { Pet } from "../model/Pet";
import type { NameSearch } from "../model/Search";
import { petRepository } from "../repository/PetRepository";
import type { IsoDate } from "../utils/datas";
import type { Cents } from "../utils/dinheiro";

class PetService {
  getPetById(id: number) {
    return petRepository.getPetById(id);
  }

  getAllPets() {
    return petRepository.getAllPets();
  }

  searchPetsPage(search: NameSearch) {
    return petRepository.searchPetsPage(search);
  }

  getPetsByOwnerId(ownerId: number) {
    return petRepository.getPetsByOwnerId(ownerId);
  }

  createPet(pet: Pet) {
    return petRepository.createPet(pet);
  }

  updatePet(id: number, pet: Pet) {
    return petRepository.updatePet(id, pet);
  }

  updateRemarcacao(
    id: number,
    remarcacaoAtiva: number,
    pacoteRemarcacao: number | null,
    dataInicioPacote: IsoDate | null,
    valorPacote: Cents | null,
  ) {
    return petRepository.updateRemarcacao(
      id,
      remarcacaoAtiva,
      pacoteRemarcacao,
      dataInicioPacote,
      valorPacote,
    );
  }

  deletePet(id: number) {
    return petRepository.deletePet(id);
  }

  activePet(id: number) {
    return petRepository.activePet(id);
  }
}

export const petService = new PetService();
