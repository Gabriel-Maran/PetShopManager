import { Owner } from "../model/Owner";
import type { NameSearch } from "../model/Search";
import { ownerRepository } from "../repository/OwnerRepository";

class OwnerService {
  getOwnerById(id: number) {
    return ownerRepository.getOwnerById(id);
  }

  getAllOwners() {
    return ownerRepository.getAllOwners();
  }

  searchOwnersPage(search: NameSearch) {
    return ownerRepository.searchOwnersPage(search);
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
