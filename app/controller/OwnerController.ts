import { ownerService } from "../service/OwnerService";

class OwnerController {
  async getOwnerById(id: number) {
    return ownerService.getOwnerById(id);
  }

  async getAllOwners() {
    return ownerService.getAllOwners();
  }

  async getAllOwnersPaged(page: number, limit: number) {
    return ownerService.getAllOwnersPaged(page, limit);
  }

  async createOwner(
    nome: string,
    telefone: string,
    email?: string,
    endereco?: string,
  ): Promise<void> {
    if (!nome || !telefone || nome.trim() === "" || telefone.trim() === "") {
      throw new Error("Nome and telefone are required");
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
      throw new Error("Nome and telefone are required");
    }
    await ownerService.updateOwner(id, nome, telefone, email, endereco);
  }

  async deleteOwner(id: number): Promise<void> {
    await ownerService.deleteOwner(id);
  }
}

export const ownerController = new OwnerController();
