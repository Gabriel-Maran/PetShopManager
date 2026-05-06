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

  searchPetsByName(query: string): Promise<Pet[]> {
    return petService.searchPetsByName(query);
  }

  getPetsByOwnerId(ownerId: number): Promise<Pet[]> {
    return petService.getPetsByOwnerId(ownerId);
  }

  countPets(): Promise<number> {
    return petService.countPets();
  }

  async createPet(
    nome: string,
    especie: EspeciesAtendidas,
    porte: PorteAnimal,
    dono_id: number,
    raca?: string | null,
    observacoes?: string | null,
    servico_padrao: TipoServico = TipoServico.Banho,
    remarcacao_ativa: number = 0,
    pacote_remarcacao?: PacoteRemarcacao | null,
    data_inicio_pacote?: number | null,
  ): Promise<void> {
    if (!nome?.trim() || !especie || !dono_id || !porte) {
      throw new Error("Nome, espécie, dono e porte são obrigatórios");
    }
    await ownerController.getOwnerById(dono_id); // valida existência do dono

    const pet: Pet = {
      nome,
      especie,
      porte,
      dono_id,
      servico_padrao,
      remarcacao_ativa,
      raca: raca ?? null,
      observacoes: observacoes ?? null,
      pacote_remarcacao: pacote_remarcacao ?? null,
      data_inicio_pacote: data_inicio_pacote ?? null,
      is_ativo: 1,
    };

    await petService.createPet(pet);
  }

  async updatePet(
    id: number,
    nome: string,
    especie: EspeciesAtendidas,
    porte: PorteAnimal,
    dono_id: number,
    raca?: string | null,
    observacoes?: string | null,
    servico_padrao: TipoServico = TipoServico.Banho,
    remarcacao_ativa: number = 0,
    pacote_remarcacao?: PacoteRemarcacao | null,
    data_inicio_pacote?: number | null,
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
      raca: raca ?? null,
      observacoes: observacoes ?? null,
      pacote_remarcacao: pacote_remarcacao ?? null,
      data_inicio_pacote: data_inicio_pacote ?? null,
      is_ativo: 1,
    };

    await petService.updatePet(id, pet);
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
