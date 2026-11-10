import { speciesService } from "../service/SpeciesService";
import { Species } from "../repository/SpeciesRepository";
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
    return speciesService.searchBreeds(
      breedSearch.especieId,
      breedSearch.page,
      breedSearch.query,
    );
  }

  async countBreeds(speciesId: number, search: string): Promise<number> {
    const breedSearch = parseInput(breedCountSchema, {
      especieId: speciesId,
      query: search,
    });
    return speciesService.countBreeds(breedSearch.especieId, breedSearch.query);
  }
}

export const speciesController = new SpeciesController();
