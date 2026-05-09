import { speciesService } from "../service/SpeciesService";

class SpeciesController {
  async searchSpecies(): Promise<{ id: number; nome: string }[]> {
    return speciesService.searchSpecies();
  }
  async searchBreedsBySpecies(
    speciesId: number,
  ): Promise<{ id: number; nome: string }[]> {
    return speciesService.searchBreedsBySpecies(speciesId);
  }
}

export const speciesController = new SpeciesController();
