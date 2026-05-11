import { ORDER } from "../config/consts";
import { Owner, OwnerBuilder } from "../model/Owner";
import { ownerService } from "../service/OwnerService";

class OwnerController {
  async getOwnerById(id: number): Promise<Owner> {
    const owner = await ownerService.getOwnerById(id);
    if (!owner) throw new Error("Dono não encontrado");
    return owner;
  }

  getAllOwners(): Promise<Owner[]> {
    return ownerService.getAllOwners();
  }

  searchOwnersByNamePaged(
    query: string,
    page: number,
    limit: number,
    order: ORDER = ORDER.DESC,
    ativo: number = 1,
  ): Promise<Owner[]> {
    if (!query.trim()) {
      return this.getAllOwnersPaged(page, limit, order, ativo);
    }
    return ownerService.searchOwnersByNamePaged(
      query,
      page,
      limit,
      order,
      ativo,
    );
  }

  getAllOwnersPaged(
    page: number,
    limit: number,
    order: ORDER = ORDER.DESC,
    ativo: number = 1,
  ): Promise<Owner[]> {
    return ownerService.getAllOwnersPaged(page, limit, order, ativo);
  }

  countOwners(): Promise<number> {
    return ownerService.countOwners();
  }

  async createOwner(owner: Owner): Promise<void> {
    if (
      !owner.nome.trim() ||
      !owner.telefone.trim() ||
      !this.isValidPhone(owner.telefone.trim())
    ) {
      throw new Error("Nome e telefone são obrigatórios");
    }
    await ownerService.createOwner(owner);
  }

  async updateOwner(id: number, owner: Owner): Promise<void> {
    if (
      !owner.nome.trim() ||
      !owner.telefone.trim() ||
      !this.isValidPhone(owner.telefone.trim())
    ) {
      throw new Error("Nome e telefone são obrigatórios");
    }
    await this.getOwnerById(id); // valida existência, já faz throw se não encontrar
    await ownerService.updateOwner(id, owner);
  }

  async deleteOwner(id: number): Promise<void> {
    await this.getOwnerById(id); // valida existência
    await ownerService.deleteOwner(id);
  }

  async activeOwner(id: number): Promise<void> {
    await this.getOwnerById(id); // valida existência
    await ownerService.activeOwner(id);
  }

  isValidPhone(v: string): boolean {
    const d = v.replace(/\D/g, "");
    if (d.length < 10 || d.length > 11) return false;
    if (/^(\d)\1+$/.test(d)) return false;
    if (d.length === 11 && d[2] !== "9") return false;
    return true;
  }
}

export const ownerController = new OwnerController();
