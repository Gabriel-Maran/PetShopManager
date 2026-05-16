import { getDatabase } from "../config/database";

class RaceTypeRepository {
  async createRace(especieId: number, nomeRaca: string): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO race (especie_id, nome_raca) VALUES (?, ?)`,
      [especieId, nomeRaca],
    );
    return result.lastInsertRowId; // Retorna o ID da raça criada
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
    const result = await db.getAllAsync<{
      id: number;
      especie_id: number;
      nome_raca: string;
    }>(`SELECT id, especie_id, nome_raca FROM race WHERE nome_raca LIKE ?`, [
      `%${nomeRaca}%`,
    ]);
    return result ?? [];
  }
}

export const raceRepository = new RaceTypeRepository();
