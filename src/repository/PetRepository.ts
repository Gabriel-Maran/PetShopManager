import { getDatabase } from "../config/database";
import { DEACTIVATE_PET_SQL, FIND_PET_SQL, searchPetsSql } from "./sql/petsSql";
import { fetchPage } from "./fetchPage";
import { Pet, PetWithSpeciesBreedAndOwner } from "../model/Pet";
import type { NameSearch, Page } from "../model/Search";

// Cadastrar, editar e reativar podem mexer na agenda do pacote, então esses comandos ficam no
// PackageScheduleRepository, que roda na transação da remarcação.
class PetRepository {
  async getPetById(id: number): Promise<Pet | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Pet>(FIND_PET_SQL, [id]);
  }

  searchPetsPage(search: NameSearch): Promise<Page<PetWithSpeciesBreedAndOwner>> {
    return fetchPage<PetWithSpeciesBreedAndOwner>(searchPetsSql(search));
  }

  async deactivatePet(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(DEACTIVATE_PET_SQL, [id]);
  }
}

export const petRepository = new PetRepository();
