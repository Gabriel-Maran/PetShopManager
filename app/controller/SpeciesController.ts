import { speciesService } from "../service/SpeciesService";
import { Species } from "../repository/SpeciesRepository";
import { normalizeForSearch } from "../utils/formatadores/normalizaNome";

class SpeciesController {
  async searchSpecies(): Promise<Species[]> {
    return speciesService.searchSpecies();
  }
  async searchBreed(
    speciesId: number,
    page: number,
    search: string,
  ): Promise<Species[]> {
    if (!search) {
      return speciesService.getBreedsBySpeciesPaginated(speciesId, page);
    }
    const normalizedSearch = normalizeForSearch(search);
    return speciesService.searchBreedsBySpeciesAndSearchNamePaginated(
      speciesId,
      page,
      normalizedSearch,
    );
  }

  async countBreeds(speciesId: number, search: string) {
    if (!search) {
      return speciesService.countBreedsBySpecies(speciesId);
    }
    const normalizedSearch = normalizeForSearch(search);
    return speciesService.countBreedsBySpeciesAndSearchName(
      speciesId,
      normalizedSearch,
    );
  }
}

export const speciesController = new SpeciesController();
