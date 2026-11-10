import { speciesService } from "../service/SpeciesService";
import { Species } from "../repository/SpeciesRepository";
import type { Breed, BreedRecord } from "../model/Breed";
import { AppError } from "../errors/AppError";
import { MESSAGES } from "../globals/messages";
import { breedSchema } from "../validation/breedSchema";
import { breedCountSchema, breedSearchSchema } from "../validation/searchSchema";
import { parseInput, parseRecordId } from "../validation/parseInput";

/** A raça nova como o modal manda, antes de conferir. */
interface BreedInput {
  especieId: number;
  nomeRaca: string;
}

class SpeciesController {
  async searchSpecies(): Promise<Species[]> {
    return speciesService.searchSpecies();
  }

  async searchBreed(
    speciesId: number,
    page: number,
    search: string,
  ): Promise<Breed[]> {
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

  async getBreedById(id: number): Promise<BreedRecord> {
    const breed = await speciesService.getBreedById(
      parseRecordId(id, MESSAGES.breed.notFound),
    );
    if (!breed) throw new AppError("NOT_FOUND", MESSAGES.breed.notFound);
    return breed;
  }

  /**
   * Cadastra a raça e devolve o id. O breedSchema confere a espécie e o nome, de 2 a 50 caracteres sem
   * espaço nas pontas, e o service recusa o nome que já existe na espécie.
   */
  async createBreed(input: BreedInput): Promise<number> {
    return speciesService.createBreed(parseInput(breedSchema, input));
  }
}

export const speciesController = new SpeciesController();
