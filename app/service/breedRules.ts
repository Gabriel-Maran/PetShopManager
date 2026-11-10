// As regras da raça, que o SpeciesService aplica ao cadastrar a raça e ao salvar o pet. Sem depender do
// Expo, para os testes rodarem no Node, que exige a extensão .ts nos imports.
import { AppError } from "../errors/AppError.ts";
import { MESSAGES } from "../globals/messages.ts";
import type { BreedRecord } from "../model/Breed";
import { normalizeForSearch } from "../utils/formatadores/normalizaNome.ts";

/** O nome como a comparação enxerga: sem acento, em minúsculas e com um espaço só entre as palavras. */
export const breedNameKey = (name: string): string => normalizeForSearch(name).replace(/\s+/g, " ");

/** Recusa o nome que já existe na espécie, mesmo com outro acento, maiúscula ou espaçamento. */
export function assertNewBreedName(existingNames: readonly string[], name: string): void {
  const key = breedNameKey(name);
  if (existingNames.some((existing) => breedNameKey(existing) === key)) {
    throw new AppError("CONFLICT", MESSAGES.breed.duplicate);
  }
}

/** A raça escolhida para o pet precisa existir e ser da espécie escolhida. */
export function assertBreedOfSpecies(breed: BreedRecord | null, speciesId: number): void {
  if (!breed) throw new AppError("NOT_FOUND", MESSAGES.breed.notFound);
  if (breed.especie_id !== speciesId) {
    throw new AppError("VALIDATION", MESSAGES.pet.breedOfOtherSpecies);
  }
}
