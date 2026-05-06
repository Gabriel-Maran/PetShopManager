import { petService } from "../service/PetService";
import {
  EspeciesAtendidas,
  ORDER,
  PacoteRemarcacao,
  PorteAnimal,
  TipoServico,
} from "../config/consts";
import { Pet } from "../model/Pet";
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

  countPets(): Promise<number> {
    return petService.countPets();
  }

  async createPet(
    nome: string,
    especie: EspeciesAtendidas,
    porte: PorteAnimal,
    dono_id: number,
    raca?: string,
    observacoes?: string,
    servico_padrao: TipoServico = TipoServico.Banho,
    remarcacao_ativa: number = 0,
    remarcacao_gap_dias?: PacoteRemarcacao,
  ): Promise<void> {
    if (!nome?.trim() || !especie || !dono_id || !porte) {
      throw new Error("Nome, espécie, dono e porte são obrigatórios");
    }
    await ownerController.getOwnerById(dono_id); // valida existência do dono, já faz throw

    const pet: Pet = {
      nome,
      especie,
      porte,
      dono_id,
      servico_padrao,
      remarcacao_ativa,
      raca,
      observacoes,
      remarcacao_gap_dias,
    };

    await petService.createPet(pet);
  }

  async updatePet(
    id: number,
    nome: string,
    especie: EspeciesAtendidas,
    porte: PorteAnimal,
    dono_id: number,
    raca?: string,
    observacoes?: string,
    servico_padrao: TipoServico = TipoServico.Banho,
    remarcacao_ativa: number = 0,
    remarcacao_gap_dias?: PacoteRemarcacao,
  ): Promise<void> {
    if (!nome?.trim() || !especie || !dono_id || !porte) {
      throw new Error("Nome, espécie, dono e porte são obrigatórios");
    }
    await this.getPetById(id); // valida existência do pet

    const pet: Pet = {
      nome,
      especie,
      porte,
      dono_id,
      servico_padrao,
      remarcacao_ativa,
      raca,
      observacoes,
      remarcacao_gap_dias,
    };

    await petService.updatePet(id, pet);
  }

  async deletePet(id: number): Promise<void> {
    await this.getPetById(id); // valida existência
    await petService.deletePet(id);
  }

  async activePet(id: number): Promise<void> {
    await this.getPetById(id); // valida existência
    await petService.activePet(id);
  }
}

export const petController = new PetController();
