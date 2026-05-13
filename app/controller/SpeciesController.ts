import { speciesService } from "../service/SpeciesService";
import { Species } from "../repository/SpeciesRepository";


class SpeciesController {
  async searchSpecies(): Promise<Species[]> {
    return speciesService.searchSpecies();
  }
  async searchBreedsBySpecies(
    speciesId: number,
  ): Promise<Species[]> {
    return speciesService.searchBreedsBySpecies(speciesId);
  }
}

export const speciesController = new SpeciesController();
