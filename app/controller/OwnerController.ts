import { ORDER } from "../config/consts";
import { Owner } from "../model/Owner";
import { ownerService } from "../service/OwnerService";

class OwnerController {
  async getOwnerById(id: number): Promise<Owner> {
    const owner = await ownerService.getOwnerById(id);
    if (!owner) {
      throw new Error("Usuário não encontrado");
    }
    return owner;
  }

  getAllOwners(): Promise<Owner[]> {
    return ownerService.getAllOwners();
  }

  getAllOwnersPaged(
    page: number,
    limit: number,
    order: ORDER = ORDER.DESC,
  ): Promise<Owner[]> {
    return ownerService.getAllOwnersPaged(page, limit, order);
  }

  countOwners(): Promise<number> {
    return ownerService.countOwners();
  }

  async createOwner(
    nome: string,
    telefone: string,
    email?: string,
    endereco?: string,
  ): Promise<void> {
    if (!nome?.trim() || !telefone?.trim()) {
      throw new Error("Nome e telefone são obrigatórios");
    }

    await ownerService.createOwner(nome, telefone, email, endereco);
  }

  async updateOwner(
    id: number,
    nome: string,
    telefone: string,
    email?: string,
    endereco?: string,
  ): Promise<void> {
    if (!nome?.trim() || !telefone?.trim()) {
      throw new Error("Nome e telefone são obrigatórios");
    }

    await ownerService.updateOwner(id, nome, telefone, email, endereco);
  }

  async deleteOwner(id: number): Promise<void> {
    await ownerService.deleteOwner(id);
  }
}

export const ownerController = new OwnerController();
