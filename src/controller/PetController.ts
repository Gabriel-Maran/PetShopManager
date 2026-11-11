import { petService } from "../service/PetService";
import { Pet, PetWithSpecieRaceAndOwner } from "../model/Pet";
import { AppError } from "../errors/AppError";
import { MESSAGES } from "../globals/messages";
import type { NameSearch, Page } from "../model/Search";
import { petSchema, petSchemaFor } from "../validation/petSchema";
import { parseInput, parseRecordId } from "../validation/parseInput";
import { validateNameSearch } from "./validateNameSearch";
import { ownerController } from "./OwnerController";

class PetController {
  // ─── Consultas ───────────────────────────────────────────────────────────

  async getPetById(id: number): Promise<Pet> {
    const pet = await petService.getPetById(parseRecordId(id, MESSAGES.pet.notFound));
    if (!pet) throw new AppError("NOT_FOUND", MESSAGES.pet.notFound);
    return pet;
  }

  async searchPetsPage(
    search: NameSearch,
  ): Promise<Page<PetWithSpecieRaceAndOwner>> {
    return petService.searchPetsPage(validateNameSearch(search));
  }

  // ─── Mutações ────────────────────────────────────────────────────────────

  async createPet(input: Pet): Promise<void> {
    const pet = parseInput(petSchema, input);
    await ownerController.getOwnerById(pet.dono_id);
    await petService.createPet(pet);
  }

  async updatePet(id: number, input: Pet): Promise<void> {
    // O gravado vem antes da validação: o limite da observação vale só para o que mudou.
    const stored = await this.getPetById(id);
    const pet = parseInput(petSchemaFor(stored), input);
    await ownerController.getOwnerById(pet.dono_id);
    await petService.updatePet(id, pet);
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
