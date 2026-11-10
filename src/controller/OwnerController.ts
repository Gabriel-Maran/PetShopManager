import { Owner } from "../model/Owner";
import type { NameSearch, Page } from "../model/Search";
import { ownerService } from "../service/OwnerService";
import { AppError } from "../errors/AppError";
import { MESSAGES } from "../globals/messages";
import { ownerSchema } from "../validation/ownerSchema";
import { parseInput, parseRecordId } from "../validation/parseInput";
import { validateNameSearch } from "./validateNameSearch";

class OwnerController {
  async getOwnerById(id: number): Promise<Owner> {
    const owner = await ownerService.getOwnerById(parseRecordId(id, MESSAGES.owner.notFound));
    if (!owner) throw new AppError("NOT_FOUND", MESSAGES.owner.notFound);
    return owner;
  }

  async searchOwnersPage(search: NameSearch): Promise<Page<Owner>> {
    return ownerService.searchOwnersPage(validateNameSearch(search));
  }

  async createOwner(input: Owner): Promise<void> {
    await ownerService.createOwner(parseInput(ownerSchema, input));
  }

  async updateOwner(id: number, input: Owner): Promise<void> {
    const owner = parseInput(ownerSchema, input);
    await this.getOwnerById(id); // valida existência, já faz throw se não encontrar
    await ownerService.updateOwner(id, owner);
  }

  async deactivateOwner(id: number): Promise<void> {
    await this.getOwnerById(id); // valida existência
    await ownerService.deactivateOwner(id);
  }

  async activateOwner(id: number): Promise<void> {
    await this.getOwnerById(id); // valida existência
    await ownerService.activateOwner(id);
  }
}

export const ownerController = new OwnerController();
