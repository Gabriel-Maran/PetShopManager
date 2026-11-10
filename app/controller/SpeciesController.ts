import { speciesService } from "../service/SpeciesService";
import { Species } from "../repository/SpeciesRepository";
import { normalizeForSearch } from "../utils/formatadores/normalizaNome";
import { breedCountSchema, breedSearchSchema } from "../validation/searchSchema";
import { parseInput } from "../validation/parseInput";

class SpeciesController {
  async searchSpecies(): Promise<Species[]> {
    return speciesService.searchSpecies();
  }
  async searchBreed(
    speciesId: number,
    page: number,
    search: string,
  ): Promise<Species[]> {
    const breedSearch = parseInput(breedSearchSchema, {
      especieId: speciesId,
      page,
      query: search,
    });
    if (!breedSearch.query) {
      return speciesService.getBreedsBySpeciesPaginated(
        breedSearch.especieId,
        breedSearch.page,
      );
    }
    return speciesService.searchBreedsBySpeciesAndSearchNamePaginated(
      breedSearch.especieId,
      breedSearch.page,
      normalizeForSearch(breedSearch.query),
    );
  }

  async countBreeds(speciesId: number, search: string) {
    const breedSearch = parseInput(breedCountSchema, {
      especieId: speciesId,
      query: search,
    });
    if (!breedSearch.query) {
      return speciesService.countBreedsBySpecies(breedSearch.especieId);
    }
    return speciesService.countBreedsBySpeciesAndSearchName(
      breedSearch.especieId,
      normalizeForSearch(breedSearch.query),
    );
  }
}

export const speciesController = new SpeciesController();
