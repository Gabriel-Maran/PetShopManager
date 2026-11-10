import type { OwnerData } from "../validation/ownerSchema";
import type { NameSearchData } from "../validation/searchSchema";
import { ownerRepository } from "../repository/OwnerRepository";

class OwnerService {
  getOwnerById(id: number) {
    return ownerRepository.getOwnerById(id);
  }

  searchOwnersPage(search: NameSearchData) {
    return ownerRepository.searchOwnersPage(search);
  }

  createOwner(owner: OwnerData) {
    return ownerRepository.createOwner(owner);
  }

  updateOwner(id: number, owner: OwnerData) {
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
