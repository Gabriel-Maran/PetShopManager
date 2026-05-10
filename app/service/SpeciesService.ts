import { speciesRepository } from "../repository/SpeciesRepository";
import { Species } from "../repository/SpeciesRepository";

class SpeciesService {
  searchSpecies(): Promise<Species[]> {
    return speciesRepository.searchSpecies();
  }
  searchBreedsBySpecies(id: number): Promise<{ id: number; nome: string }[]> {
    return speciesRepository.searchBreedsBySpecies(id);
  }
}

export const speciesService = new SpeciesService();
