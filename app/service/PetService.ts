import { petRepository } from "../repository/PetRepository";
import type { PetData } from "../validation/petSchema";
import type { NameSearchData } from "../validation/searchSchema";
import { speciesService } from "./SpeciesService";

class PetService {
  getPetById(id: number) {
    return petRepository.getPetById(id);
  }

  searchPetsPage(search: NameSearchData) {
    return petRepository.searchPetsPage(search);
  }

  async createPet(pet: PetData) {
    await speciesService.assertBreedOfSpecies(pet.raca, pet.especie);
    return petRepository.createPet(pet);
  }

  async updatePet(id: number, pet: PetData) {
    await speciesService.assertBreedOfSpecies(pet.raca, pet.especie);
    return petRepository.updatePet(id, pet);
  }

  deactivatePet(id: number) {
    return petRepository.deactivatePet(id);
  }

  activatePet(id: number) {
    return petRepository.activatePet(id);
  }
}

export const petService = new PetService();
