import { getDatabase } from "../config/database";
import {
  ACTIVATE_OWNER_SQL,
  DEACTIVATE_OWNER_SQL,
  INSERT_OWNER_SQL,
  searchOwnersSql,
} from "./sql/ownersSql";
import { fetchPage } from "./fetchPage";
import { Owner } from "../model/Owner";
import type { NameSearch, Page } from "../model/Search";
import { normalizeForSearch } from "../utils/formatadores/normalizaNome";

class OwnerRepository {
  async getOwnerById(id: number): Promise<Owner | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Owner>(`SELECT * FROM owners WHERE id = ?`, [id]);
  }

  searchOwnersPage(search: NameSearch): Promise<Page<Owner>> {
    return fetchPage<Owner>(searchOwnersSql(search));
  }

  async createOwner(owner: Owner): Promise<void> {
    const nome_normalizado = normalizeForSearch(owner.nome);
    const db = await getDatabase();
    await db.runAsync(
      INSERT_OWNER_SQL,
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

  async deactivateOwner(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(DEACTIVATE_OWNER_SQL, [id]);
  }

  async activateOwner(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(ACTIVATE_OWNER_SQL, [id]);
  }
}

export const ownerRepository = new OwnerRepository();
