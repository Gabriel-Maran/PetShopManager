import { petService } from "../service/PetService";

class PetController {
  async getPetById(id: number) {
    return petService.getPetById(id);
  }
  async getAllPets() {
    return petService.getAllPets();
  }
  async getAllPetsPaged(page: number, limit: number) {
    return petService.getAllPetsPaged(page, limit);
  }
  async createPet(
    nome: string,
    especie: string,
    dono_id: number,
    raca?: string,
    observacoes?: string,
  ): Promise <void> {
    if (!nome || !especie || nome.trim() === "" || !dono_id ) {
      throw new Error("Nome, especie e dono são obrigatórios");
    }
    await petService.createPet(nome, especie, dono_id, raca, observacoes)
  }
  async updatePet(
    nome: string,
    especie: string,
    dono_id: number,
    raca?: string,
    observacoes?: string,
  ): Promise <void> {
    if (!nome || !especie || nome.trim() === "" || !dono_id ) {
      throw new Error("Nome, especie e dono são obrigatórios");
    }
    await petService.updatePet(nome, especie, dono_id, raca, observacoes)
  }
  async deletePet(id: number){
    await petService.deletePet(id)
  }
}

export const petController = new PetController();