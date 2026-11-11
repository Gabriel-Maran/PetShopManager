import { getDatabase } from "../config/database";
import { LIMIT_ITEM_PAGE } from "../config/consts";
import type { Breed, BreedRecord } from "../model/Breed";
import { normalizeForSearch } from "../utils/formatters/normalizeForSearch";
import {
  countBreedsSql,
  FIND_BREED_SQL,
  INSERT_BREED_SQL,
  LIST_BREED_NAMES_SQL,
  listBreedsSql,
} from "./sql/breedsSql";

class BreedRepository {
  async createBreed(speciesId: number, breedName: string): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(INSERT_BREED_SQL, [
      speciesId,
      breedName,
      normalizeForSearch(breedName),
    ]);
    return result.lastInsertRowId;
  }

  async findBreedById(id: number): Promise<BreedRecord | null> {
    const db = await getDatabase();
    return db.getFirstAsync<BreedRecord>(FIND_BREED_SQL, [id]);
  }

  /** Os nomes de todas as raças da espécie, para conferir a raça repetida. */
  async listBreedNames(speciesId: number): Promise<string[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Pick<BreedRecord, "name">>(LIST_BREED_NAMES_SQL, [speciesId]);
    return rows.map((row) => row.name);
  }

  /** Uma página (a partir de 0) das raças da espécie com `query` no nome. Vazio traz todas. */
  async searchBreeds(speciesId: number, page: number, query: string): Promise<Breed[]> {
    const db = await getDatabase();
    const { sql, params } = listBreedsSql(speciesId, query, page, LIMIT_ITEM_PAGE);
    return db.getAllAsync<Breed>(sql, params);
  }

  /** O total da mesma busca, para a paginação. */
  async countBreeds(speciesId: number, query: string): Promise<number> {
    const db = await getDatabase();
    const { sql, params } = countBreedsSql(speciesId, query);
    const result = await db.getFirstAsync<{ total: number }>(sql, params);
    return result?.total ?? 0;
  }
}

export const breedRepository = new BreedRepository();
