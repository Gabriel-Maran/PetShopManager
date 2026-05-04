import { petService } from "../service/PetService";
import { PacoteRemarcacao, PorteAnimal, TipoServico } from "../config/consts";
import { Pet } from "../model/Pet";
import { ownerController } from "./OwnerController";

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
    porte: PorteAnimal,
    dono_id: number,
    raca?: string,
    observacoes?: string,
    servico_padrao: TipoServico = TipoServico.Banho, // Valor padrão caso não venha nada
    remarcacao_ativa: number = 0, // 0 para desligado
    remarcacao_gap_dias?: PacoteRemarcacao,
  ): Promise<void> {
    if (!nome || !especie || nome.trim() === "" || !dono_id || !porte) {
      throw new Error("Nome, especie, dono e porte são obrigatórios");
    }
    const owner = ownerController.getOwnerById(dono_id);
    if (!owner) {
      throw new Error("Dono não encontrado com o id " + dono_id);
    }

    let meuPet: Pet = {
      nome: nome,
      especie: especie,
      dono_id: dono_id,
      porte: porte,
      servico_padrao: servico_padrao,
      remarcacao_ativa: remarcacao_ativa,
      raca: raca,
      observacoes: observacoes,
      remarcacao_gap_dias: remarcacao_gap_dias,
    };

    await petService.createPet(meuPet);
  }

  async updatePet(
    id: number,
    nome: string,
    especie: string,
    porte: PorteAnimal,
    dono_id: number,
    raca?: string,
    observacoes?: string,
    servico_padrao: TipoServico = TipoServico.Banho, // Valor padrão caso não venha nada
    remarcacao_ativa: number = 0, // 0 para desligado
    remarcacao_gap_dias?: PacoteRemarcacao,
  ): Promise<void> {
    if (!nome || !especie || nome.trim() === "" || !dono_id || !porte) {
      throw new Error("Nome, especie, dono e porte são obrigatórios");
    }
    const owner = ownerController.getOwnerById(dono_id);
    if (!owner) {
      throw new Error("Dono não encontrado");
    }

    let meuPet: Pet = {
      nome: nome,
      especie: especie,
      dono_id: dono_id,
      porte: porte,
      servico_padrao: servico_padrao,
      remarcacao_ativa: remarcacao_ativa,
      raca: raca,
      observacoes: observacoes,
      remarcacao_gap_dias: remarcacao_gap_dias,
    };

    await petService.updatePet(id, meuPet);
  }
}

export const petController = new PetController();
