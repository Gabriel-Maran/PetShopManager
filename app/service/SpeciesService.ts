import { speciesRepository } from "../repository/SpeciesRepository";

class SpeciesService {
  searchSpecies() {
    return speciesRepository.searchSpecies();
  }
  searchBreedsBySpecies(id: number) {
    return speciesRepository.searchBreedsBySpecies(id);
  }
}

export const speciesService = new SpeciesService();
