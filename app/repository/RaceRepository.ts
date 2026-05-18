import { getDatabase } from "../config/database";
import { normalizeForSearch } from "../utils/formatadores/normalizaNome";

class RaceTypeRepository {
  async createRace(especieId: number, nomeRaca: string): Promise<number> {
    const db = await getDatabase();
    const nomeNormalizado = normalizeForSearch(nomeRaca);
    const result = await db.runAsync(
      `INSERT INTO race (especie_id, nome_raca, nome_raca_normalized) VALUES (?, ?, ?)`,
      [especieId, nomeRaca, nomeNormalizado],
    );
    return result.lastInsertRowId;
  }

  async findRaceById(
    id: number,
  ): Promise<{ id: number; especie_id: number; nome_raca: string } | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{
      id: number;
      especie_id: number;
      nome_raca: string;
    }>(`SELECT id, especie_id, nome_raca FROM race WHERE id = ?`, [id]);
    return result ?? null;
  }

  async findRaceByNome(
    nomeRaca: string,
  ): Promise<{ id: number; especie_id: number; nome_raca: string }[]> {
    const db = await getDatabase();
    const nomeNormalizado = normalizeForSearch(nomeRaca);

    const result = await db.getAllAsync<{
      id: number;
      especie_id: number;
      nome_raca: string;
    }>(
      `SELECT id, especie_id, nome_raca FROM race WHERE nome_raca_normalized LIKE ?`,
      [`%${nomeNormalizado}%`],
    );
    return result ?? [];
  }
}

export const raceRepository = new RaceTypeRepository();
