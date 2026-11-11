// As buscas por nome: a de donos e pets, e a de raças (VALID-1). Sem depender do Expo, para os testes
// rodarem no Node, que exige a extensão .ts nos imports.
import * as z from "zod";
import { MESSAGES } from "../globals/messages.ts";
import { MAX_SEARCH_LENGTH } from "../globals/limits.ts";
import { flag, id, text } from "./fields.ts";

/** O texto digitado, sem espaço nas pontas. Vazio lista todos. */
const query = text(MAX_SEARCH_LENGTH, MESSAGES.search.tooLong(MAX_SEARCH_LENGTH));

/** A página, a partir de 0. */
const page = z.int(MESSAGES.search.invalidPage).nonnegative(MESSAGES.search.invalidPage);

/** A busca de donos e de pets, a mesma nos dois. */
export const nameSearchSchema = z.object({
  query,
  active: flag("Filtro ativo"),
  page,
  limit: z.int(MESSAGES.search.invalidPage).positive(MESSAGES.search.invalidPage),
});

/** A busca conferida, com o texto sem espaço nas pontas. */
export type NameSearchData = z.output<typeof nameSearchSchema>;

/** A busca de raças de uma espécie, no seletor de raça do pet. */
export const breedSearchSchema = z.object({
  speciesId: id(MESSAGES.breed.speciesRequired),
  query,
  page,
});

/** A contagem das raças para a paginação: a mesma busca, sem a página. */
export const breedCountSchema = breedSearchSchema.omit({ page: true });
