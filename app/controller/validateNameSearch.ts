// Validação da busca por nome, a mesma para donos e pets. Sem depender do Expo, para os testes
// rodarem no Node, que exige a extensão .ts nos imports.
import { AppError } from "../errors/AppError.ts";
import { MESSAGES } from "../globals/messages.ts";
import { MAX_SEARCH_LENGTH } from "../globals/limits.ts";
import type { NameSearch } from "../model/Search";

/** Confere o filtro, a página e o tamanho do texto antes de a busca chegar ao banco. */
export function validateNameSearch(search: NameSearch): void {
  if (search.ativo !== 0 && search.ativo !== 1) {
    throw new AppError("VALIDATION", MESSAGES.invalidFlag("Filtro ativo"));
  }
  const validPage = Number.isInteger(search.page) && search.page >= 0;
  const validLimit = Number.isInteger(search.limit) && search.limit > 0;
  if (!validPage || !validLimit) {
    throw new AppError("VALIDATION", MESSAGES.search.invalidPage);
  }
  if (search.query.trim().length > MAX_SEARCH_LENGTH) {
    throw new AppError("VALIDATION", MESSAGES.search.tooLong(MAX_SEARCH_LENGTH));
  }
}
