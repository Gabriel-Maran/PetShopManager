import { ownerRepository } from "../repository/OwnerRepository";

class OwnerService {
  getOwnerById(id: number) {
    return ownerRepository.getOwnerById(id);
  }

  getAllOwners() {
    return ownerRepository.getAllOwners();
  }

  getAllOwnersPaged(page: number, limit: number) {
    return ownerRepository.getAllOwnersPaged(page, limit);
  }

  createOwner(
    nome: string,
    telefone: string,
    email?: string,
    endereco?: string,
  ) {
    return ownerRepository.createOwner(nome, telefone, email, endereco);
  }

  updateOwner(
    id: number,
    nome: string,
    telefone: string,
    email?: string,
    endereco?: string,
  ) {
    return ownerRepository.updateOwner(id, nome, telefone, email, endereco);
  }

  deleteOwner(id: number) {
    return ownerRepository.deleteOwner(id);
  }
}

export const ownerService = new OwnerService();
