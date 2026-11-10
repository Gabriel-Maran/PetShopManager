import { getDatabase } from "../config/database";
import { petRepository } from "../repository/PetRepository";
import type { PetData } from "../validation/petSchema";
import type { NameSearchData } from "../validation/searchSchema";
import { PackageScheduleService } from "./PackageScheduleService";
import { speciesService } from "./SpeciesService";

// Gravar o pet pode mexer na agenda do pacote, então cadastro, edição e reativação passam pela
// remarcação, que grava tudo numa transação só.
const packageSchedule = new PackageScheduleService(getDatabase);

class PetService {
  getPetById(id: number) {
    return petRepository.getPetById(id);
  }

  searchPetsPage(search: NameSearchData) {
    return petRepository.searchPetsPage(search);
  }

  async createPet(pet: PetData) {
    await speciesService.assertBreedOfSpecies(pet.raca, pet.especie);
    return packageSchedule.createPet(pet, new Date());
  }

  async updatePet(id: number, pet: PetData) {
    await speciesService.assertBreedOfSpecies(pet.raca, pet.especie);
    return packageSchedule.updatePet(id, pet, new Date());
  }

  // O trigger trg_pet_desativar_limpar_remarcacao apaga os automáticos futuros e desliga o pacote.
  deactivatePet(id: number) {
    return petRepository.deactivatePet(id);
  }

  activatePet(id: number) {
    return packageSchedule.activatePet(id, new Date());
  }
}

export const petService = new PetService();
