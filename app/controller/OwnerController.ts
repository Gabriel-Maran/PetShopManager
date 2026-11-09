import { Owner, OwnerBuilder } from "../model/Owner";
import type { NameSearch, Page } from "../model/Search";
import { ownerService } from "../service/OwnerService";
import { AppError } from "../errors/AppError";
import { MESSAGES } from "../globals/messages";
import { validateNameSearch } from "./validateNameSearch";

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

  async searchOwnersPage(search: NameSearch): Promise<Page<Owner>> {
    validateNameSearch(search);
    return ownerService.searchOwnersPage(search);
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

  async deactivateOwner(id: number): Promise<void> {
    await this.getOwnerById(id); // valida existência
    await ownerService.deactivateOwner(id);
  }

  async activateOwner(id: number): Promise<void> {
    await this.getOwnerById(id); // valida existência
    await ownerService.activateOwner(id);
  }
}

export const ownerController = new OwnerController();
