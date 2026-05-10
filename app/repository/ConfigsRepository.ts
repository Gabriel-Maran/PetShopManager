import { getDatabase } from "../config/database";
import { Config } from "../model/Configuration";

class ConfigsRepository {
  async getConfigById(id: number): Promise<Config | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Config>(`SELECT * FROM configs WHERE id = ?`, [id]);
  }

  async updateConfig(id: number, is_ativo: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`UPDATE configs SET is_ativo = ? WHERE id = ?`, [
      is_ativo,
      id,
    ]);
  }
}

export const configsRepository = new ConfigsRepository();
