import { ORDER } from "../config/consts";
import { getDatabase } from "../config/database";
import { ACTIVATE_PET_SQL, DEACTIVATE_PET_SQL, INSERT_PET_SQL, UPDATE_PET_REMARCACAO_SQL, UPDATE_PET_SQL } from "./sql/petsSql";
import { Pet, PetWithSpecieRaceAndOwner } from "../model/Pet";
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

  async getAllPetsPaged(
    page: number = 0,
    limit: number = 20,
    order: ORDER,
  ): Promise<Pet[]> {
    const db = await getDatabase();
    const offset = page * limit;
    return db.getAllAsync<Pet>(
      `SELECT * FROM pets WHERE is_ativo = 1 ORDER BY criado_em ${order} LIMIT ? OFFSET ?`,
      [limit, offset],
    );
  }

  async getAllPetsPagedWithSpecieRaceAndOwner(
    page: number = 0,
    limit: number = 20,
    order: ORDER,
    ativo: number = 1,
  ): Promise<PetWithSpecieRaceAndOwner[]> {
    const db = await getDatabase();
    const offset = page * limit;

    return db.getAllAsync<PetWithSpecieRaceAndOwner>(
      `SELECT 
        PT.*,
        SP.nome      AS nome_especie,
        RC.nome_raca AS nome_raca,
        OW.nome      AS nome_dono
       FROM pets    AS PT
       JOIN species AS SP ON PT.especie = SP.id
       JOIN race    AS RC ON PT.raca    = RC.id
       JOIN owners  AS OW ON PT.dono_id = OW.id
       WHERE PT.is_ativo = ?
       ORDER BY PT.criado_em ${order}
       LIMIT ? OFFSET ?`,
      [ativo, limit, offset],
    );
  }

  async searchPetsByNamePaged(
    query: string,
    page: number = 0,
    limit: number = 20,
    order: ORDER = ORDER.ASC,
    ativo: number = 1,
  ): Promise<Pet[]> {
    const db = await getDatabase();
    const offset = page * limit;
    const query_normalizada = normalizeForSearch(query);

    return db.getAllAsync<Pet>(
      `SELECT * FROM pets
       WHERE nome_normalizado LIKE ?
       AND is_ativo = ?
       ORDER BY nome_normalizado ${order}
       LIMIT ? OFFSET ?`,
      [`%${query_normalizada}%`, ativo, limit, offset],
    );
  }

  async searchPetsByNamePagedWithSpecieRaceAndOwner(
    query: string,
    page: number = 0,
    limit: number = 20,
    order: ORDER = ORDER.ASC,
    ativo: number = 1,
  ): Promise<PetWithSpecieRaceAndOwner[]> {
    const db = await getDatabase();
    const offset = page * limit;
    const query_normalizada = normalizeForSearch(query);

    return db.getAllAsync<PetWithSpecieRaceAndOwner>(
      `SELECT
        PT.*,
        SP.nome      AS nome_especie,
        RC.nome_raca AS nome_raca,
        OW.nome      AS nome_dono
       FROM pets    AS PT
       JOIN species AS SP ON PT.especie = SP.id
       JOIN race    AS RC ON PT.raca    = RC.id
       JOIN owners  AS OW ON PT.dono_id = OW.id
       WHERE PT.nome_normalizado LIKE ?
       AND PT.is_ativo = ?
       ORDER BY PT.nome_normalizado ${order}
       LIMIT ? OFFSET ?`,
      [`%${query_normalizada}%`, ativo, limit, offset],
    );
  }

  async getPetsByOwnerId(ownerId: number): Promise<Pet[]> {
    const db = await getDatabase();
    return db.getAllAsync<Pet>(
      `SELECT * FROM pets WHERE dono_id = ? AND is_ativo = 1 ORDER BY nome ASC`,
      [ownerId],
    );
  }

  async countPets(search?: string, ativo: number = 1): Promise<number> {
    const db = await getDatabase();

    if (search?.trim()) {
      const query_normalizada = normalizeForSearch(search);
      const result = await db.getFirstAsync<{ total: number }>(
        `SELECT COUNT(*) AS total
         FROM pets
         WHERE is_ativo = ? AND nome_normalizado LIKE ?`,
        [ativo, `%${query_normalizada}%`],
      );
      return result?.total ?? 0;
    }

    const result = await db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) AS total FROM pets WHERE is_ativo = ?`,
      [ativo],
    );
    return result?.total ?? 0;
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

  async deletePet(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(DEACTIVATE_PET_SQL, [id]);
  }

  async activePet(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(ACTIVATE_PET_SQL, [id]);
  }
}

export const petRepository = new PetRepository();
