import { getDatabase } from "../config/database";
import { EspeciesAtendidas, LIMIT_ITEM_PAGE } from "../config/consts";
import { countBreedsSql, listBreedsSql } from "./sql/breedsSql";

export type Species = {
  id: number;
  nome: EspeciesAtendidas;
};

class SpeciesRepository {
  async searchSpecies(): Promise<Species[]> {
    const db = await getDatabase();
    return db.getAllAsync<Species>(
      `SELECT id, nome FROM SPECIES ORDER BY nome ASC`,
    );
  }

  /** Uma página (a partir de 0) das raças da espécie com `query` no nome. Vazio traz todas. */
  async searchBreeds(
    speciesId: number,
    page: number,
    query: string,
  ): Promise<any[]> {
    const db = await getDatabase();
    const { sql, params } = listBreedsSql(speciesId, query, page, LIMIT_ITEM_PAGE);
    return db.getAllAsync<any>(sql, params);
  }

  /** O total da mesma busca, para a paginação. */
  async countBreeds(speciesId: number, query: string): Promise<number> {
    const db = await getDatabase();
    const { sql, params } = countBreedsSql(speciesId, query);
    const result = await db.getFirstAsync<{ total: number }>(sql, params);
    return result?.total ?? 0;
  }
}

export const speciesRepository = new SpeciesRepository();
