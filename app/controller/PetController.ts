import { petService } from "../service/PetService";
import { PacoteRemarcacao, PorteAnimal, TipoServico } from "../config/consts";
import { Pet, PetWithSpecieRaceAndOwner } from "../model/Pet";
import { AppError } from "../errors/AppError";
import { MESSAGES } from "../globals/messages";
import type { NameSearch, Page } from "../model/Search";
import { createPetSchemas } from "../validation/petSchema";
import { parseInput, parseRecordId } from "../validation/parseInput";
import { validateNameSearch } from "./validateNameSearch";
import { ownerController } from "./OwnerController";

const petSchemas = createPetSchemas({
  porte: PorteAnimal,
  servico: TipoServico,
  pacote: PacoteRemarcacao,
});

/** O pacote de remarcação como a tela manda, antes de conferir. */
type PetRemarcacaoInput = Pick<
  Pet,
  "remarcacao_ativa" | "pacote_remarcacao" | "data_inicio_pacote" | "valor_pacote"
>;

class PetController {
  // ─── Consultas ───────────────────────────────────────────────────────────

  async getPetById(id: number): Promise<Pet> {
    const pet = await petService.getPetById(parseRecordId(id, MESSAGES.pet.notFound));
    if (!pet) throw new AppError("NOT_FOUND", MESSAGES.pet.notFound);
    return pet;
  }

  getAllPets(): Promise<Pet[]> {
    return petService.getAllPets();
  }

  async searchPetsPage(
    search: NameSearch,
  ): Promise<Page<PetWithSpecieRaceAndOwner>> {
    return petService.searchPetsPage(validateNameSearch(search));
  }

  getPetsByOwnerId(ownerId: number): Promise<Pet[]> {
    return petService.getPetsByOwnerId(ownerId);
  }

  // ─── Mutações ────────────────────────────────────────────────────────────

  async createPet(input: Pet): Promise<void> {
    const pet = parseInput(petSchemas.pet, input);
    await ownerController.getOwnerById(pet.dono_id);
    await petService.createPet(pet);
  }

  async updatePet(id: number, input: Pet): Promise<void> {
    const pet = parseInput(petSchemas.pet, input);
    await this.getPetById(id);
    await ownerController.getOwnerById(pet.dono_id);
    await petService.updatePet(id, pet);
  }

  async updateRemarcacao(id: number, input: PetRemarcacaoInput): Promise<void> {
    const remarcacao = parseInput(petSchemas.remarcacao, input);
    await this.getPetById(id);
    await petService.updateRemarcacao(id, remarcacao);
  }

  async deactivatePet(id: number): Promise<void> {
    await this.getPetById(id);
    await petService.deactivatePet(id);
  }

  async activatePet(id: number): Promise<void> {
    await this.getPetById(id);
    await petService.activatePet(id);
  }
}

export const petController = new PetController();
