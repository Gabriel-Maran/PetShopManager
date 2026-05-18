import { petService } from "../service/PetService";
import { ORDER } from "../config/consts";
import { Pet, PetWithSpecieRaceAndOwner } from "../model/Pet";
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

  getAllPetsPagedWithSpecieAndRace(
    page: number,
    limit: number,
    order: ORDER,
    ativo: number = 1,
  ): Promise<PetWithSpecieRaceAndOwner[]> {
    return petService.getAllPetsPagedWithSpecieRaceAndOwner(
      page,
      limit,
      order,
      ativo,
    );
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

  searchPetsByNamePagedWithSpecieAndRace(
    query: string,
    page: number,
    limit: number,
    order: ORDER = ORDER.DESC,
    ativo: number = 1,
  ): Promise<PetWithSpecieRaceAndOwner[]> {
    if (!query.trim()) {
      return this.getAllPetsPagedWithSpecieAndRace(page, limit, order, ativo);
    }
    return petService.searchPetsByNamePagedWithSpecieRaceAndOwner(
      query,
      page,
      limit,
      order,
      ativo,
    );
  }

  getPetsByOwnerId(ownerId: number): Promise<Pet[]> {
    return petService.getPetsByOwnerId(ownerId);
  }

  // ATUALIZADO: aceita search opcional para contar resultados filtrados
  // Necessário para a paginação do modal de seleção de pet funcionar
  countPets(search?: string): Promise<number> {
    return petService.countPets(search);
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
    await ownerController.getOwnerById(petSalvar.dono_id);
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
    await ownerController.getOwnerById(petSalvar.dono_id);
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
