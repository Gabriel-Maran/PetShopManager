import { ORDER } from "../config/consts";
import { Owner } from "../model/Owner";
import { ownerRepository } from "../repository/OwnerRepository";

class OwnerService {
  getOwnerById(id: number) {
    return ownerRepository.getOwnerById(id);
  }

  getAllOwners() {
    return ownerRepository.getAllOwners();
  }

  getAllOwnersPaged(page: number, limit: number, order: ORDER) {
    return ownerRepository.getAllOwnersPaged(page, limit, order);
  }

  countOwners() {
    return ownerRepository.countOwners();
  }

  createOwner(owner: Owner) {
    return ownerRepository.createOwner(owner);
  }

  updateOwner(id: number, owner: Owner) {
    return ownerRepository.updateOwner(id, owner);
  }

  deleteOwner(id: number) {
    return ownerRepository.deleteOwner(id);
  }

  activeOwner(id: number) {
    return ownerRepository.activeOwner(id);
  }
}

export const ownerService = new OwnerService();
