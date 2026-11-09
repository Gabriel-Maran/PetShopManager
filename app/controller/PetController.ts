import { petService } from "../service/PetService";
import {
  ORDER,
  PacoteRemarcacao,
  PorteAnimal,
  TipoServico,
} from "../config/consts";
import { Pet, PetWithSpecieRaceAndOwner } from "../model/Pet";
import { type IsoDate, isIsoDate } from "../utils/datas";
import { type Cents, INVALID_MONEY_MESSAGE, isValidCents } from "../utils/dinheiro";
import { ownerController } from "./OwnerController";

class PetController {
  // ─── Helpers de validação ────────────────────────────────────────────────

  private validatePorte(porte: unknown): void {
    if (!Object.values(PorteAnimal).includes(porte as PorteAnimal)) {
      throw new Error(
        `Porte inválido. Valores aceitos: ${Object.values(PorteAnimal).join(", ")}`,
      );
    }
  }

  private validateServicoPadrao(servico: unknown): void {
    if (!Object.values(TipoServico).includes(servico as TipoServico)) {
      throw new Error(
        `Serviço padrão inválido. Valores aceitos: ${Object.values(TipoServico).join(", ")}`,
      );
    }
  }

  private validateFlag(value: unknown, campo: string): void {
    if (value !== 0 && value !== 1) {
      throw new Error(`${campo} deve ser 0 ou 1`);
    }
  }

  private validateRemarcacaoFields(pet: Partial<Pet>): void {
    // Sem pacote ativo, o valor pode ficar vazio, mas o que vier precisa ser centavos.
    if (pet.valor_pacote != null && !isValidCents(pet.valor_pacote)) {
      throw new Error(INVALID_MONEY_MESSAGE);
    }

    if (pet.remarcacao_ativa !== 1) return;

    const pacoteValido = Object.values(PacoteRemarcacao).includes(
      pet.pacote_remarcacao as PacoteRemarcacao,
    );
    if (!pacoteValido) {
      throw new Error(
        `Pacote de remarcação inválido. Valores aceitos: ${Object.values(PacoteRemarcacao).join(", ")}`,
      );
    }

    if (pet.valor_pacote == null) {
      throw new Error(
        "Valor do pacote é obrigatório quando a remarcação está ativa, no formato 120,00",
      );
    }

    if (!isIsoDate(pet.data_inicio_pacote)) {
      throw new Error(
        "Data de início do pacote é obrigatória. Escolha a data no calendário.",
      );
    }
  }

  private validateBaseFields(pet: Partial<Pet>): void {
    if (!pet.nome?.trim()) {
      throw new Error("Nome é obrigatório");
    }

    if (!pet.especie || pet.especie <= 0) {
      throw new Error("Espécie é obrigatória e deve ser um valor válido");
    }

    if (!pet.dono_id || pet.dono_id <= 0) {
      throw new Error("Dono é obrigatório e deve ser um valor válido");
    }

    this.validatePorte(pet.porte);

    if (!pet.raca || pet.raca <= 0) {
      throw new Error("Raça é obrigatória");
    }
  }

  // ─── Consultas ───────────────────────────────────────────────────────────

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
    this.validateFlag(ativo, "Filtro ativo");
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
    this.validateFlag(ativo, "Filtro ativo");
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

  countPets(search?: string): Promise<number> {
    return petService.countPets(search);
  }

  // ─── Mutações ────────────────────────────────────────────────────────────

  async createPet(petSalvar: Pet): Promise<void> {
    // Campos base obrigatórios (raca é opcional conforme a interface)
    this.validateBaseFields(petSalvar);

    // servico_padrao é obrigatório na interface
    this.validateServicoPadrao(petSalvar.servico_padrao);

    // remarcacao_ativa deve ser 0 ou 1
    this.validateFlag(petSalvar.remarcacao_ativa, "Remarcação ativa");

    // is_ativo deve ser 0 ou 1
    this.validateFlag(petSalvar.is_ativo, "Ativo");

    // Campos do pacote de remarcação quando ativo
    this.validateRemarcacaoFields(petSalvar);

    await ownerController.getOwnerById(petSalvar.dono_id);
    await petService.createPet(petSalvar);
  }

  async updatePet(id: number, petSalvar: Pet): Promise<void> {
    // raca não é obrigatória na atualização (opcional na interface)
    this.validateBaseFields(petSalvar);

    // servico_padrao é obrigatório na interface
    this.validateServicoPadrao(petSalvar.servico_padrao);

    // remarcacao_ativa deve ser 0 ou 1
    this.validateFlag(petSalvar.remarcacao_ativa, "Remarcação ativa");

    // is_ativo deve ser 0 ou 1
    this.validateFlag(petSalvar.is_ativo, "Ativo");

    // Campos do pacote quando remarcação ativa
    this.validateRemarcacaoFields(petSalvar);

    await this.getPetById(id);
    await ownerController.getOwnerById(petSalvar.dono_id);
    await petService.updatePet(id, petSalvar);
  }

  async updateRemarcacao(
    id: number,
    remarcacaoAtiva: number,
    pacoteRemarcacao: PacoteRemarcacao | null,
    dataInicioPacote: IsoDate | null,
    valorPacote: Cents | null,
  ): Promise<void> {
    this.validateFlag(remarcacaoAtiva, "Remarcação ativa");

    // Reutiliza validateRemarcacaoFields com um objeto parcial
    this.validateRemarcacaoFields({
      remarcacao_ativa: remarcacaoAtiva,
      pacote_remarcacao: pacoteRemarcacao,
      data_inicio_pacote: dataInicioPacote,
      valor_pacote: valorPacote,
    });

    await this.getPetById(id);
    await petService.updateRemarcacao(
      id,
      remarcacaoAtiva,
      pacoteRemarcacao,
      dataInicioPacote,
      valorPacote,
    );
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
