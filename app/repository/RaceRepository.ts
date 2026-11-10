import { getDatabase } from "../config/database";
import { LIMIT_ITEM_PAGE } from "../config/consts";
import type { Breed, BreedRecord } from "../model/Breed";
import { normalizeForSearch } from "../utils/formatadores/normalizaNome";
import {
  countBreedsSql,
  FIND_BREED_SQL,
  INSERT_BREED_SQL,
  LIST_BREED_NAMES_SQL,
  listBreedsSql,
} from "./sql/breedsSql";

class RaceRepository {
  async createBreed(especieId: number, nomeRaca: string): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(INSERT_BREED_SQL, [
      especieId,
      nomeRaca,
      normalizeForSearch(nomeRaca),
    ]);
    return result.lastInsertRowId;
  }

  async findBreedById(id: number): Promise<BreedRecord | null> {
    const db = await getDatabase();
    return db.getFirstAsync<BreedRecord>(FIND_BREED_SQL, [id]);
  }

  /** Os nomes de todas as raças da espécie, para conferir a raça repetida. */
  async listBreedNames(especieId: number): Promise<string[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Pick<BreedRecord, "nome_raca">>(
      LIST_BREED_NAMES_SQL,
      [especieId],
    );
    return rows.map((row) => row.nome_raca);
  }

  /** Uma página (a partir de 0) das raças da espécie com `query` no nome. Vazio traz todas. */
  async searchBreeds(
    especieId: number,
    page: number,
    query: string,
  ): Promise<Breed[]> {
    const db = await getDatabase();
    const { sql, params } = listBreedsSql(especieId, query, page, LIMIT_ITEM_PAGE);
    return db.getAllAsync<Breed>(sql, params);
  }

  /** O total da mesma busca, para a paginação. */
  async countBreeds(especieId: number, query: string): Promise<number> {
    const db = await getDatabase();
    const { sql, params } = countBreedsSql(especieId, query);
    const result = await db.getFirstAsync<{ total: number }>(sql, params);
    return result?.total ?? 0;
  }
}

export const raceRepository = new RaceRepository();
