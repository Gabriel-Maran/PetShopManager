import { Pet } from "../model/Pet";
import { petRepository } from "../repository/PetRepository";

class PetService {
  getPetById(id: number) {
    return petRepository.getPetById(id);
  }

  getAllPets() {
    return petRepository.getAllPets();
  }

  getAllPetsPaged(page: number, limit: number) {
    return petRepository.getAllPetsPaged(page, limit);
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
}

export const petService = new PetService();
