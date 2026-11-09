import { ORDER } from "../config/consts";
import { Owner, OwnerBuilder } from "../model/Owner";
import { ownerService } from "../service/OwnerService";
import { AppError } from "../errors/AppError";
import { MESSAGES } from "../globals/messages";

/** Nome e telefone obrigatórios, e o telefone com DDD. Cada falha tem a sua mensagem. */
function validateOwner(owner: Owner): void {
  if (!owner.nome.trim()) {
    throw new AppError("VALIDATION", MESSAGES.owner.nameRequired);
  }
  const telefone = owner.telefone.trim();
  if (!telefone) {
    throw new AppError("VALIDATION", MESSAGES.owner.phoneRequired);
  }
  if (!isValidPhone(telefone)) {
    throw new AppError("VALIDATION", MESSAGES.owner.phoneInvalid);
  }
}

/** DDD e número, com 10 ou 11 dígitos; o celular de 11 tem o 9 logo depois do DDD. */
function isValidPhone(v: string): boolean {
  const d = v.replace(/\D/g, "");
  if (d.length < 10 || d.length > 11) return false;
  if (/^(\d)\1+$/.test(d)) return false;
  if (d.length === 11 && d[2] !== "9") return false;
  return true;
}

class OwnerController {
  async getOwnerById(id: number): Promise<Owner> {
    const owner = await ownerService.getOwnerById(id);
    if (!owner) throw new AppError("NOT_FOUND", MESSAGES.owner.notFound);
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

  countOwners(search?: string): Promise<number> {
    return ownerService.countOwners(search);
  }

  async createOwner(owner: Owner): Promise<void> {
    validateOwner(owner);
    await ownerService.createOwner(owner);
  }

  async updateOwner(id: number, owner: Owner): Promise<void> {
    validateOwner(owner);
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
}

export const ownerController = new OwnerController();
