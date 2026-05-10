import { petService } from "../service/PetService";
import { ORDER } from "../config/consts";
import { Pet, PetWithSpecie } from "../model/Pet";
import { ownerController } from "./OwnerController";

class PetController {
  async getPetById(id: number): Promise<Pet> {
    const pet = await petService.getPetById(id);
    if (!pet) throw new Error("Pet não encontrado");
    return pet;
  }

  getAllPets(): Promise<Pet[]> {
    return petService.getAllPets();
  }

  getAllPetsPaged(page: number, limit: number, order: ORDER): Promise<Pet[]> {
    return petService.getAllPetsPaged(page, limit, order);
  }

  getAllPetsPagedWithSpecie(page: number, limit: number, order: ORDER): Promise<PetWithSpecie[]> {
    return petService.getAllPetsPagedWithSpecie(page, limit, order);
  }

  searchPetsByNamePaged(
    query: string,
    page: number,
    limit: number,
    order: ORDER = ORDER.DESC,
  ): Promise<Pet[]> {
    if (!query.trim()) {
      return this.getAllPetsPaged(page, limit, order);
    }
    return petService.searchPetsByNamePaged(query, page, limit, order);
  }

  searchPetsByNamePagedWithSpecie(
    query: string,
    page: number,
    limit: number,
    order: ORDER = ORDER.DESC,
  ): Promise<PetWithSpecie[]> {
    if (!query.trim()) {
      return this.getAllPetsPagedWithSpecie(page, limit, order);
    }
    return petService.searchPetsByNamePagedWithSpecie(query, page, limit, order);
  }

  getPetsByOwnerId(ownerId: number): Promise<Pet[]> {
    return petService.getPetsByOwnerId(ownerId);
  }

  countPets(): Promise<number> {
    return petService.countPets();
  }

  async createPet(petSalvar: Pet): Promise<void> {
    if (
      !petSalvar.nome?.trim() ||
      !petSalvar.especie ||
      !petSalvar.dono_id ||
      !petSalvar.porte
    ) {
      throw new Error("Nome, espécie, dono e porte são obrigatórios");
    }
    await ownerController.getOwnerById(petSalvar.dono_id); // valida existência do dono
    await petService.createPet(petSalvar);
  }

  async updatePet(id: number, petSalvar: Pet): Promise<void> {
    if (
      !petSalvar.nome?.trim() ||
      !petSalvar.especie ||
      !petSalvar.dono_id ||
      !petSalvar.porte
    ) {
      throw new Error("Nome, espécie, dono e porte são obrigatórios");
    }
    await this.getPetById(id);
    await ownerController.getOwnerById(petSalvar.dono_id); // valida existência do dono
    await petService.updatePet(id, petSalvar);
  }

  async deletePet(id: number): Promise<void> {
    await this.getPetById(id);
    await petService.deletePet(id);
  }

  async activePet(id: number): Promise<void> {
    await this.getPetById(id);
    await petService.activePet(id);
  }
}

export const petController = new PetController();
