import { raceRepository } from "../repository/RaceRepository";
import { AppError } from "../errors/AppError";
import { MESSAGES } from "../globals/messages";
import { breedSchema } from "../validation/breedSchema";
import { parseInput } from "../validation/parseInput";

interface CreateRaceParams {
  especieId: number;
  nomeRaca: string;
}

/**
 * Cria uma raça e devolve o id dela. O breedSchema confere a espécie e o nome, de 2 a 50 caracteres
 * sem espaço nas pontas; a mesma raça na mesma espécie, sem olhar maiúsculas, é recusada.
 */
export async function createRaceService(input: CreateRaceParams): Promise<number> {
  const { especieId, nomeRaca } = parseInput(breedSchema, input);

  const existing = await raceRepository.findRaceByNome(nomeRaca);
  const isDuplicate = existing.some(
    (race) =>
      race.nome_raca.trim().toLowerCase() === nomeRaca.toLowerCase() &&
      race.especie_id === especieId,
  );
  if (isDuplicate) {
    throw new AppError("CONFLICT", MESSAGES.breed.duplicate);
  }

  return raceRepository.createRace(especieId, nomeRaca);
}
