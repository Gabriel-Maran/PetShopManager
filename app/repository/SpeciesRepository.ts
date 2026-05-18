import { getDatabase } from "../config/database";
import { EspeciesAtendidas, LIMIT_ITEM_PAGE } from "../config/consts";

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

  async searchBreedsBySpeciesAndSearchNamePaginated(
    speciesId: number,
    page: number, // 0-indexado
    normalizedSearch: string,
  ): Promise<any[]> {
    const db = await getDatabase();
    const limit = LIMIT_ITEM_PAGE;
    const offset = page * limit;

    return db.getAllAsync<any>(
      `SELECT id, nome_raca AS nome
       FROM race
       WHERE especie_id = ? AND nome_raca_normalized LIKE ?
       ORDER BY nome_raca ASC
       LIMIT ? OFFSET ?`,
      [speciesId, `%${normalizedSearch}%`, limit, offset],
    );
  }

  async getBreedsBySpeciesPaginated(
    speciesId: number,
    page: number, // 0-indexado
  ): Promise<any[]> {
    const db = await getDatabase();
    const limit = LIMIT_ITEM_PAGE;
    const offset = page * limit;

    return db.getAllAsync<any>(
      `SELECT id, nome_raca AS nome
       FROM race
       WHERE especie_id = ?
       ORDER BY nome_raca ASC
       LIMIT ? OFFSET ?`,
      [speciesId, limit, offset],
    );
  }

  async countBreedsBySpeciesAndSearchName(
    speciesId: number,
    normalizedSearch: string,
  ): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM race
       WHERE especie_id = ? AND nome_raca_normalized LIKE ?`,
      [speciesId, `%${normalizedSearch}%`],
    );
    return result?.total ?? 0;
  }

  async countBreedsBySpecies(speciesId: number): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM race
       WHERE especie_id = ?`,
      [speciesId],
    );
    return result?.total ?? 0;
  }
}

export const speciesRepository = new SpeciesRepository();
