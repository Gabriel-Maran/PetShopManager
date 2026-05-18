import { speciesRepository } from "../repository/SpeciesRepository";
import { Species } from "../repository/SpeciesRepository";

class SpeciesService {
  searchSpecies(): Promise<Species[]> {
    return speciesRepository.searchSpecies();
  }
  async searchBreedsBySpeciesAndSearchNamePaginated(
    speciesId: number,
    page: number,
    normalizedSearch: string,
  ): Promise<any[]> {
    return speciesRepository.searchBreedsBySpeciesAndSearchNamePaginated(
      speciesId,
      page,
      normalizedSearch,
    );
  }

  async getBreedsBySpeciesPaginated(
    speciesId: number,
    page: number,
  ): Promise<any[]> {
    return speciesRepository.getBreedsBySpeciesPaginated(speciesId, page);
  }

  async countBreedsBySpecies(speciesId: number): Promise<number> {
    return speciesRepository.countBreedsBySpecies(speciesId);
  }

  async countBreedsBySpeciesAndSearchName(
    speciesId: number,
    normalizedSearch: string,
  ): Promise<number> {
    return speciesRepository.countBreedsBySpeciesAndSearchName(
      speciesId,
      normalizedSearch,
    );
  }
}

export const speciesService = new SpeciesService();
