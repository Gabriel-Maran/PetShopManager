import { getDatabase } from "../config/database";
import {
  ACTIVATE_PET_SQL,
  DEACTIVATE_PET_SQL,
  INSERT_PET_SQL,
  searchPetsSql,
  UPDATE_PET_REMARCACAO_SQL,
  UPDATE_PET_SQL,
} from "./sql/petsSql";
import { fetchPage } from "./fetchPage";
import { Pet, PetWithSpecieRaceAndOwner } from "../model/Pet";
import type { NameSearch, Page } from "../model/Search";
import { normalizeForSearch } from "../utils/formatadores/normalizaNome";
import type { IsoDate } from "../utils/datas";
import type { Cents } from "../utils/dinheiro";

class PetRepository {
  async getPetById(id: number): Promise<Pet | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Pet>(`SELECT * FROM pets WHERE id = ?`, [id]);
  }

  async getAllPets(): Promise<Pet[]> {
    const db = await getDatabase();
    return db.getAllAsync<Pet>(
      `SELECT * FROM pets WHERE is_ativo = 1 ORDER BY criado_em DESC`,
    );
  }

  searchPetsPage(search: NameSearch): Promise<Page<PetWithSpecieRaceAndOwner>> {
    return fetchPage<PetWithSpecieRaceAndOwner>(searchPetsSql(search));
  }

  async getPetsByOwnerId(ownerId: number): Promise<Pet[]> {
    const db = await getDatabase();
    return db.getAllAsync<Pet>(
      `SELECT * FROM pets WHERE dono_id = ? AND is_ativo = 1 ORDER BY nome ASC`,
      [ownerId],
    );
  }

  async createPet(pet: Pet): Promise<void> {
    const db = await getDatabase();
    const nome_normalizado = normalizeForSearch(pet.nome);
    await db.runAsync(
      INSERT_PET_SQL,
      [
        pet.nome,
        nome_normalizado,
        pet.especie,
        pet.porte,
        pet.raca ?? null,
        pet.observacoes ?? null,
        pet.dono_id,
        pet.servico_padrao ?? "Banho",
        pet.remarcacao_ativa ?? 0,
        pet.pacote_remarcacao ?? null,
        pet.data_inicio_pacote ?? null,
        pet.horario_padrao ?? null,
        pet.valor_pacote ?? null,
      ],
    );
  }

  async updatePet(id: number, pet: Pet): Promise<void> {
    const db = await getDatabase();
    const nome_normalizado = normalizeForSearch(pet.nome);
    await db.runAsync(
      UPDATE_PET_SQL,
      [
        pet.nome,
        nome_normalizado,
        pet.especie,
        pet.porte,
        pet.raca ?? null,
        pet.observacoes ?? null,
        pet.dono_id,
        pet.servico_padrao ?? "Banho",
        pet.remarcacao_ativa ?? 0,
        pet.pacote_remarcacao ?? null,
        pet.data_inicio_pacote ?? null,
        pet.horario_padrao ?? null,
        pet.valor_pacote ?? null,
        id,
      ],
    );
  }

  async updateRemarcacao(
    id: number,
    remarcacaoAtiva: number,
    pacoteRemarcacao: number | null,
    dataInicioPacote: IsoDate | null,
    valorPacote: Cents | null,
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      UPDATE_PET_REMARCACAO_SQL,
      [
        remarcacaoAtiva,
        pacoteRemarcacao ?? null,
        dataInicioPacote ?? null,
        valorPacote ?? null,
        id,
      ],
    );
  }

  async deactivatePet(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(DEACTIVATE_PET_SQL, [id]);
  }

  async activatePet(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(ACTIVATE_PET_SQL, [id]);
  }
}

export const petRepository = new PetRepository();
