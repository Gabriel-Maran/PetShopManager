import { getDatabase } from "../config/database";
import { Owner } from "../model/Owner";

class OwnerService {
  async getOwnerById(id: number): Promise<Owner | null> {
    const db = await getDatabase();
    const owner = await db.getFirstAsync<Owner>(
      `SELECT * FROM owners WHERE id = ?`,
      [id],
    );
    return owner;
  }

  async getAllOwners(): Promise<Owner[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Owner>(
      `SELECT * FROM owners ORDER BY criado_em DESC`,
    );
  }
  async getAllOwnersPaged(
    page: number = 0,
    limit: number = 20,
  ): Promise<Owner[]> {
    const db = await getDatabase();
    const offset = page * limit;
    return await db.getAllAsync<Owner>(
      `SELECT * FROM owners ORDER BY criado_em DESC LIMIT ? OFFSET ?`,
      [limit, offset],
    );
  }

  async createOwner(
    nome: string,
    telefone: string,
    email?: string,
    endereco?: string,
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO owners (nome, telefone, email, endereco) VALUES (?, ?, ?, ?)`,
      [nome, telefone, email ?? null, endereco ?? null],
    );
  }

  async updateOwner(
    id: number,
    nome: string,
    telefone: string,
    email?: string,
    endereco?: string,
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE owners SET nome = ?, telefone = ?, email = ?, endereco = ? WHERE id = ?`,
      [nome, telefone, email ?? null, endereco ?? null, id],
    );
  }

  async deleteOwner(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM owners WHERE id = ?`, [id]);
  }
}

export const ownerService = new OwnerService();
