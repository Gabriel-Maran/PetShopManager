import { getDatabase } from "../config/database";
import type { SpeciesCode } from "../config/petEnums";
import { FIND_SPECIES_SQL } from "./sql/breedsSql";

/** Uma espécie: o id e o nome guardado no banco, um dos `SpeciesCode`. */
export type Species = {
  id: number;
  name: SpeciesCode;
};

class SpeciesRepository {
  async searchSpecies(): Promise<Species[]> {
    const db = await getDatabase();
    return db.getAllAsync<Species>(
      `SELECT id, name FROM species ORDER BY name ASC`,
    );
  }

  async speciesExists(id: number): Promise<boolean> {
    const db = await getDatabase();
    return (await db.getFirstAsync(FIND_SPECIES_SQL, [id])) !== null;
  }
}

export const speciesRepository = new SpeciesRepository();
