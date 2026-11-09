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

  deactivateOwner(id: number) {
    return ownerRepository.deactivateOwner(id);
  }

  activateOwner(id: number) {
    return ownerRepository.activateOwner(id);
  }
}

export const ownerService = new OwnerService();
