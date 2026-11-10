import { getDatabase } from "../config/database";
import { FIND_SPECIES_SQL } from "./sql/breedsSql";

/**
 * Uma espécie: o id e o nome guardado no banco, um dos `EspeciesAtendidas`. O nome fica `string`
 * enquanto o `pegarRacasBanco` (usePet.ts) guarda as raças com este tipo.
 */
export type Species = {
  id: number;
  nome: string;
};

class SpeciesRepository {
  async searchSpecies(): Promise<Species[]> {
    const db = await getDatabase();
    return db.getAllAsync<Species>(
      `SELECT id, nome FROM species ORDER BY nome ASC`,
    );
  }

  async speciesExists(id: number): Promise<boolean> {
    const db = await getDatabase();
    return (await db.getFirstAsync(FIND_SPECIES_SQL, [id])) !== null;
  }
}

export const speciesRepository = new SpeciesRepository();
