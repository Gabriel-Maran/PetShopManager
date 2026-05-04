import { getDatabase } from "../config/database";
import { Pet } from "../model/Pet";

class PetRepository {
  async getPetById(id: number): Promise<Pet | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Pet>(`SELECT * FROM pets WHERE id = ?`, [id]);
  }

  async getAllPets(): Promise<Pet[]> {
    const db = await getDatabase();
    return db.getAllAsync<Pet>(`SELECT * FROM pets ORDER BY criado_em DESC`);
  }
  async getAllPetsPaged(page: number = 0, limit: number = 20): Promise<Pet[]> {
    const db = await getDatabase();
    const offset = page * limit;
    return db.getAllAsync<Pet>(
      `SELECT * FROM pets ORDER BY criado_em DESC LIMIT ? OFFSET ?`,
      [limit, offset],
    );
  }

  async createPet(
    nome: string,
    especie: string,
    dono_id: number,
    raca?: string,
    observacoes?: string,
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO pets (nome, especie, dono_id, raca, observacoes) VALUES (?, ?, ?, ?, ?)`,
      [nome, especie, dono_id, raca ?? null, observacoes ?? null],
    );
  }
  async updatePet(
    id: number,
    nome: string,
    especie: string,
    dono_id: number,
    raca?: string,
    observacoes?: string,
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO pets (nome, especie, dono_id raca, observacoes) VALUES (?, ?, ?, ?, ?)`,
      [nome, especie, dono_id, raca ?? null, observacoes ?? null],
    );
  }
  async deletePet(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM pets where id = ?`, [id]);
  }
}

export const petRepository = new PetRepository()