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
    return db.getAllAsync<Pet>(
      `SELECT * FROM pets WHERE is_ativo = 1 ORDER BY criado_em DESC`,
    );
  }

  async getAllPetsPaged(
    page: number = 0,
    limit: number = 20,
    order: ORDER,
  ): Promise<Pet[]> {
    const db = await getDatabase();
    const offset = page * limit;
    return db.getAllAsync<Pet>(
      `SELECT * FROM pets WHERE is_ativo = 1 ORDER BY criado_em ${order} LIMIT ? OFFSET ?`,
      [limit, offset],
    );
  }

  // Busca por nome usando o idx_pets_nome (prefixo) ou substring
  async searchPetsByNamePaged(
    query: string,
    page: number = 0,
    limit: number = 20,
    order: ORDER = ORDER.ASC,
  ): Promise<Pet[]> {
    const db = await getDatabase();
    const offset = page * limit;

    return db.getAllAsync<Pet>(
      `SELECT * FROM pets 
       WHERE nome LIKE ? AND is_ativo = 1 
       ORDER BY nome ${order} 
       LIMIT ? OFFSET ?`,
      [`%${query}%`, limit, offset],
    );
  }

  async getPetsByOwnerId(ownerId: number): Promise<Pet[]> {
    const db = await getDatabase();
    return db.getAllAsync<Pet>(
      `SELECT * FROM pets WHERE dono_id = ? AND is_ativo = 1 ORDER BY nome ASC`,
      [ownerId],
    );
  }

  async countPets(): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) as total FROM pets WHERE is_ativo = 1`,
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
        pacote_remarcacao,
        data_inicio_pacote
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pet.nome,
        pet.especie,
        pet.porte,
        pet.raca ?? null,
        pet.observacoes ?? null,
        pet.dono_id,
        pet.servico_padrao ?? "Banho",
        pet.remarcacao_ativa ?? 0,
        pet.pacote_remarcacao ?? null,
        pet.data_inicio_pacote ?? null,
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
        pacote_remarcacao = ?,
        data_inicio_pacote = ?
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
        pet.pacote_remarcacao ?? null,
        pet.data_inicio_pacote ?? null,
        id,
      ],
    );
  }

  // Atualiza apenas os campos de remarcação (evita sobrescrever dados não relacionados)
  async updateRemarcacao(
    id: number,
    remarcacaoAtiva: number,
    pacoteRemarcacao: number | null,
    dataInicioPacote: number | null,
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE pets SET
        remarcacao_ativa = ?,
        pacote_remarcacao = ?,
        data_inicio_pacote = ?
      WHERE id = ?`,
      [remarcacaoAtiva, pacoteRemarcacao ?? null, dataInicioPacote ?? null, id],
    );
  }

  async deletePet(id: number): Promise<void> {
    const db = await getDatabase();
    // Soft delete: marca como inativo sem remover do banco
    await db.runAsync(`UPDATE pets SET is_ativo = 0 WHERE id = ?`, [id]);
  }

  async activePet(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`UPDATE pets SET is_ativo = 1 WHERE id = ?`, [id]);
  }
}

export const petRepository = new PetRepository();
