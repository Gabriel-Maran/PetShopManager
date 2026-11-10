// A busca por nome, a mesma para donos e pets. Sem depender do Expo, para os testes rodarem no Node,
// que exige a extensão .ts nos imports.
import type { NameSearch } from "../model/Search";
import { nameSearchSchema, type NameSearchData } from "../validation/searchSchema.ts";
import { parseInput } from "../validation/parseInput.ts";

/**
 * Confere o filtro, a página e o tamanho do texto antes de a busca chegar ao banco, e devolve a busca
 * com o texto sem espaço nas pontas.
 */
export function validateNameSearch(search: NameSearch): NameSearchData {
  return parseInput(nameSearchSchema, search);
}
