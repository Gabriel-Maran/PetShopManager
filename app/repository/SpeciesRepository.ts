import { getDatabase } from "../config/database";
import { EspeciesAtendidas } from "../config/consts";

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
  async searchBreedsBySpecies(
    speciesId: number,
  ): Promise<Species[]> {
    const db = await getDatabase();
    return db.getAllAsync<Species>(
      `SELECT id, nome_raca as nome FROM race WHERE especie_id = ? ORDER BY nome_raca asc `,
      [speciesId],
    );
  }
}

export const speciesRepository = new SpeciesRepository();
