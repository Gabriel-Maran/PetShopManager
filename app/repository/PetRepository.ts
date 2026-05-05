import { ORDER } from "../config/consts";
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

  async getAllPetsPaged(
    page: number = 0,
    limit: number = 20,
    order: ORDER,
  ): Promise<Pet[]> {
    const db = await getDatabase();
    const offset = page * limit;

    return db.getAllAsync<Pet>(
      `SELECT * FROM pets ORDER BY criado_em ${order} LIMIT ? OFFSET ?`,
      [limit, offset],
    );
  }

  async countPets(): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) as total FROM pets`,
    );
    return result?.total ?? 0;
  }

  async createPet(pet: Pet): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
      `INSERT INTO pets (
      nome, 
      especie, 
      porte, 
      raca, 
      observacoes, 
      dono_id, 
      servico_padrao, 
      remarcacao_ativa, 
      remarcacao_gap_dias
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pet.nome,
        pet.especie,
        pet.porte,
        pet.raca ?? null,
        pet.observacoes ?? null,
        pet.dono_id,
        pet.servico_padrao ?? "Banho",
        pet.remarcacao_ativa ?? 0,
        pet.remarcacao_gap_dias ?? null,
      ],
    );
  }

  async updatePet(id: number, pet: Pet): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE pets SET 
      nome = ?, 
      especie = ?, 
      porte = ?, 
      raca = ?, 
      observacoes = ?, 
      dono_id = ?, 
      servico_padrao = ?, 
      remarcacao_ativa = ?, 
      remarcacao_gap_dias = ? 
    WHERE id = ?`,
      [
        pet.nome,
        pet.especie,
        pet.porte,
        pet.raca ?? null,
        pet.observacoes ?? null,
        pet.dono_id,
        pet.servico_padrao ?? "Banho",
        pet.remarcacao_ativa ?? 0,
        pet.remarcacao_gap_dias ?? null,
        id,
      ],
    );
  }

  async deletePet(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM pets where id = ?`, [id]);
  }
}

export const petRepository = new PetRepository();
