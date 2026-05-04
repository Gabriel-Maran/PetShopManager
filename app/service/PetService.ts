import { petRepository } from "../repository/PetRepository";

class PetService {
  getPetById(id: number) {
    return petRepository.getPetById(id);
  }

  getAllPets() {
    return petRepository.getAllPets;
  }
  getAllPetsPaged(page: number, limit: number) {
    return petRepository.getAllPetsPaged(page, limit);
  }
  createPet(
    nome: string,
    especie: string,
    dono_id: number,
    raca?: string,
    observacoes?: string,
  ) {
    return petRepository.createPet(nome, especie, dono_id, raca, observacoes);
  }

  updatePet(
    nome: string,
    especie: string,
    dono_id: number,
    raca?: string,
    observacoes?: string,
  ) {
    return petRepository.createPet(nome, especie, dono_id, raca, observacoes);
  }
  deletePet(id: number) {
    return petRepository.deletePet(id);
  }
}

export const petService = new PetService();