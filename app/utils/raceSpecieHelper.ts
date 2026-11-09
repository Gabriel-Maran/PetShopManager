import { raceRepository } from "../repository/RaceRepository";
import { AppError } from "../errors/AppError";
import { MESSAGES } from "../globals/messages";

interface CreateRaceParams {
  especieId: number;
  nomeRaca: string;
}

/**
 * Cria uma nova raça com validação de duplicidade por espécie e devolve o id dela.
 * Normaliza o nome antes de comparar (trim + lowercase).
 */
export async function createRaceService({
  especieId,
  nomeRaca,
}: CreateRaceParams): Promise<number> {
  if (!especieId || especieId <= 0) {
    throw new AppError("VALIDATION", MESSAGES.breed.speciesRequired);
  }

  const normalizedName = nomeRaca.trim();

  if (!normalizedName) {
    throw new AppError("VALIDATION", MESSAGES.breed.nameRequired);
  }

  if (normalizedName.length < 2) {
    throw new AppError("VALIDATION", MESSAGES.breed.nameTooShort);
  }

  const existing = await raceRepository.findRaceByNome(normalizedName);

  const isDuplicate = existing.some(
    (r) =>
      r.nome_raca.trim().toLowerCase() === normalizedName.toLowerCase() &&
      r.especie_id === especieId,
  );

  if (isDuplicate) {
    throw new AppError("CONFLICT", MESSAGES.breed.duplicate);
  }

  return raceRepository.createRace(especieId, normalizedName);
}
