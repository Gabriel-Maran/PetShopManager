// O cadastro de raça (VALID-1). Sem depender do Expo, para os testes rodarem no Node, que exige a
// extensão .ts nos imports.
import * as z from "zod";
import { MESSAGES } from "../globals/messages.ts";
import { MAX_BREED_NAME_LENGTH, MIN_BREED_NAME_LENGTH } from "../globals/limits.ts";
import { id, requiredText } from "./fields.ts";

export const breedSchema = z.object({
  speciesId: id(MESSAGES.breed.speciesRequired),
  breedName: requiredText(MAX_BREED_NAME_LENGTH, {
    required: MESSAGES.breed.nameRequired,
    tooLong: MESSAGES.textTooLong("O nome da raça", MAX_BREED_NAME_LENGTH),
  }).min(MIN_BREED_NAME_LENGTH, MESSAGES.breed.nameTooShort),
});

/** A raça conferida: a espécie e o nome sem espaço nas pontas. */
export type BreedData = z.output<typeof breedSchema>;
