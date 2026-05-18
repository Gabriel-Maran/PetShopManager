import { ORDER } from "../config/consts";
import { getDatabase } from "../config/database";
import { Owner } from "../model/Owner";
import { normalizeForSearch } from "../utils/formatadores/normalizaNome";

class OwnerRepository {
  async getOwnerById(id: number): Promise<Owner | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Owner>(`SELECT * FROM owners WHERE id = ?`, [id]);
  }

  async getAllOwners(): Promise<Owner[]> {
    const db = await getDatabase();
    return db.getAllAsync<Owner>(
      `SELECT * FROM owners WHERE is_ativo = 1 ORDER BY criado_em DESC`,
    );
  }

  async getAllOwnersPaged(
    page: number = 0,
    limit: number = 20,
    order: ORDER = ORDER.ASC,
    ativo: number = 1,
  ): Promise<Owner[]> {
    const db = await getDatabase();
    const offset = page * limit;

    return db.getAllAsync<Owner>(
      `SELECT * FROM owners 
     WHERE is_ativo = ? 
     ORDER BY criado_em ${order} 
     LIMIT ? OFFSET ?`,
      [ativo, limit, offset],
    );
  }

  async searchOwnersByNamePaged(
    query: string,
    page: number = 0,
    limit: number = 20,
    order: ORDER = ORDER.ASC,
    ativo: number = 1,
  ): Promise<Owner[]> {
    const db = await getDatabase();
    const offset = page * limit;
    const query_normalizada = normalizeForSearch(query);

    return db.getAllAsync<Owner>(
      `SELECT * FROM owners 
    WHERE nome_normalizado LIKE ? 
    AND is_ativo = ?
    ORDER BY nome_normalizado ${order} 
    LIMIT ? OFFSET ?`,
      [`%${query_normalizada}%`, ativo, limit, offset],
    );
  }

  async countOwners(search?: string): Promise<number> {
    const db = await getDatabase();

    if (search) {
      const formattedSearch = `%${search.trim()}%`;
      const result = await db.getFirstAsync<{ total: number }>(
        `SELECT COUNT(*) as total FROM owners 
       WHERE is_ativo = 1 AND nome LIKE ?`,
        [formattedSearch],
      );
      return result?.total ?? 0;
    }

    const result = await db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) as total FROM owners WHERE is_ativo = 1`,
    );
    return result?.total ?? 0;
  }

  async createOwner(owner: Owner): Promise<void> {
    const nome_normalizado = normalizeForSearch(owner.nome);
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO owners (nome, nome_normalizado, telefone, email, endereco) VALUES (?, ?, ?, ?, ?)`,
      [
        owner.nome,
        nome_normalizado,
        owner.telefone,
        owner.email ?? null,
        owner.endereco ?? null,
      ],
    );
  }

  async updateOwner(id: number, owner: Owner): Promise<void> {
    const nome_normalizado = normalizeForSearch(owner.nome);
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE owners SET nome = ?, nome_normalizado = ?, telefone = ?, email = ?, endereco = ? WHERE id = ?`,
      [
        owner.nome,
        nome_normalizado,
        owner.telefone,
        owner.email ?? null,
        owner.endereco ?? null,
        id,
      ],
    );
  }

  async deleteOwner(id: number): Promise<void> {
    const db = await getDatabase();
    // Soft delete: marca como inativo sem remover do banco
    await db.runAsync(`UPDATE owners SET is_ativo = 0 WHERE id = ?`, [id]);
  }

  async activeOwner(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`UPDATE owners SET is_ativo = 1 WHERE id = ?`, [id]);
  }
}

export const ownerRepository = new OwnerRepository();
