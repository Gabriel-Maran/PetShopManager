import { ownerService } from "../service/OwnerService";

class OwnerController {
  getOwnerById(id: number) {
    return ownerService.getOwnerById(id);
  }

  getAllOwners() {
    return ownerService.getAllOwners();
  }

  getAllOwnersPaged(page: number, limit: number) {
    return ownerService.getAllOwnersPaged(page, limit);
  }

  async createOwner(
    nome: string,
    telefone: string,
    email?: string,
    endereco?: string,
  ): Promise<void> {
    if (!nome || !telefone || nome.trim() === "" || telefone.trim() === "") {
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
    if (!nome || !telefone || nome.trim() === "" || telefone.trim() === "") {
      throw new Error("Nome e telefone são obrigatórios");
    }
    await ownerService.updateOwner(id, nome, telefone, email, endereco);
  }

  async deleteOwner(id: number): Promise<void> {
    await ownerService.deleteOwner(id);
  }
}

export const ownerController = new OwnerController();
