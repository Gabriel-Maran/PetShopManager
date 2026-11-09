import { ORDER } from "../config/consts";
import { Pet } from "../model/Pet";
import { petRepository } from "../repository/PetRepository";
import type { IsoDate } from "../utils/datas";
import type { Cents } from "../utils/dinheiro";

class PetService {
  getPetById(id: number) {
    return petRepository.getPetById(id);
  }

  getAllPets() {
    return petRepository.getAllPets();
  }

  getAllPetsPaged(page: number, limit: number, order: ORDER) {
    return petRepository.getAllPetsPaged(page, limit, order);
  }

  getAllPetsPagedWithSpecieRaceAndOwner(
    page: number,
    limit: number,
    order: ORDER,
    ativo: number = 1,
  ) {
    return petRepository.getAllPetsPagedWithSpecieRaceAndOwner(
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
    order: ORDER,
  ) {
    return petRepository.searchPetsByNamePaged(query, page, limit, order);
  }

  searchPetsByNamePagedWithSpecieRaceAndOwner(
    query: string,
    page: number,
    limit: number,
    order: ORDER,
    ativo: number = 1,
  ) {
    return petRepository.searchPetsByNamePagedWithSpecieRaceAndOwner(
      query,
      page,
      limit,
      order,
      ativo,
    );
  }

  getPetsByOwnerId(ownerId: number) {
    return petRepository.getPetsByOwnerId(ownerId);
  }

  countPets(search?: string) {
    return petRepository.countPets(search);
  }

  createPet(pet: Pet) {
    return petRepository.createPet(pet);
  }

  updatePet(id: number, pet: Pet) {
    return petRepository.updatePet(id, pet);
  }

  updateRemarcacao(
    id: number,
    remarcacaoAtiva: number,
    pacoteRemarcacao: number | null,
    dataInicioPacote: IsoDate | null,
    valorPacote: Cents | null,
  ) {
    return petRepository.updateRemarcacao(
      id,
      remarcacaoAtiva,
      pacoteRemarcacao,
      dataInicioPacote,
      valorPacote,
    );
  }

  deletePet(id: number) {
    return petRepository.deletePet(id);
  }

  activePet(id: number) {
    return petRepository.activePet(id);
  }
}

export const petService = new PetService();
