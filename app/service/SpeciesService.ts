import { speciesRepository } from "../repository/SpeciesRepository";
import { Species } from "../repository/SpeciesRepository";

class SpeciesService {
  searchSpecies(): Promise<Species[]> {
    return speciesRepository.searchSpecies();
  }

  searchBreeds(speciesId: number, page: number, query: string): Promise<any[]> {
    return speciesRepository.searchBreeds(speciesId, page, query);
  }

  countBreeds(speciesId: number, query: string): Promise<number> {
    return speciesRepository.countBreeds(speciesId, query);
  }
}

export const speciesService = new SpeciesService();
