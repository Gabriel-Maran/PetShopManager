import { AppError } from "../errors/AppError";
import { MESSAGES } from "../globals/messages";
import type { Breed, BreedRecord } from "../model/Breed";
import { raceRepository } from "../repository/RaceRepository";
import { Species, speciesRepository } from "../repository/SpeciesRepository";
import type { BreedData } from "../validation/breedSchema";
import { assertBreedOfSpecies, assertNewBreedName } from "./breedRules";

class SpeciesService {
  searchSpecies(): Promise<Species[]> {
    return speciesRepository.searchSpecies();
  }

  searchBreeds(speciesId: number, page: number, query: string): Promise<Breed[]> {
    return raceRepository.searchBreeds(speciesId, page, query);
  }

  countBreeds(speciesId: number, query: string): Promise<number> {
    return raceRepository.countBreeds(speciesId, query);
  }

  getBreedById(id: number): Promise<BreedRecord | null> {
    return raceRepository.findBreedById(id);
  }

  /** Cadastra a raça e devolve o id. A espécie precisa existir, e o nome não pode repetir nela. */
  async createBreed({ especieId, nomeRaca }: BreedData): Promise<number> {
    if (!(await speciesRepository.speciesExists(especieId))) {
      throw new AppError("NOT_FOUND", MESSAGES.species.notFound);
    }
    assertNewBreedName(await raceRepository.listBreedNames(especieId), nomeRaca);
    return raceRepository.createBreed(especieId, nomeRaca);
  }

  /** Confere, antes de salvar o pet, que a raça existe e é da espécie escolhida. */
  async assertBreedOfSpecies(breedId: number, speciesId: number): Promise<void> {
    assertBreedOfSpecies(await raceRepository.findBreedById(breedId), speciesId);
  }
}

export const speciesService = new SpeciesService();
