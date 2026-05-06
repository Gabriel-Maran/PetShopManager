import { ORDER } from "../config/consts";
import { Pet } from "../model/Pet";
import { petRepository } from "../repository/PetRepository";

class PetService {
  getPetById(id: number) {
    return petRepository.getPetById(id);
  }

  getAllPets() {
    return petRepository.getAllPets();
  }

  getAllPetsPaged(page: number, limit: number, order: ORDER) {
    return petRepository.getAllPetsPaged(page, limit, order);
  }

  searchPetsByName(query: string) {
    return petRepository.searchPetsByName(query);
  }

  getPetsByOwnerId(ownerId: number) {
    return petRepository.getPetsByOwnerId(ownerId);
  }

  countPets() {
    return petRepository.countPets();
  }

  createPet(pet: Pet) {
    return petRepository.createPet(pet);
  }

  updatePet(id: number, pet: Pet) {
    return petRepository.updatePet(id, pet);
  }

  deletePet(id: number) {
    return petRepository.deletePet(id);
  }

  activePet(id: number) {
    return petRepository.activePet(id);
  }
}

export const petService = new PetService();
