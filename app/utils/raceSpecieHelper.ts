import { raceRepository } from "../repository/RaceRepository";

interface CreateRaceParams {
  especieId: number;
  nomeRaca: string;
}

interface CreateRaceResult {
  success: boolean;
  id?: number;
  error?: string;
}

/**
 * Cria uma nova raça com validação de duplicidade por espécie.
 * Normaliza o nome antes de comparar (trim + lowercase).
 */
export async function createRaceService({
  especieId,
  nomeRaca,
}: CreateRaceParams): Promise<CreateRaceResult> {
  const normalizedName = nomeRaca.trim();

  if (!normalizedName) {
    return { success: false, error: "O nome da raça é obrigatório." };
  }

  if (normalizedName.length < 2) {
    return {
      success: false,
      error: "O nome da raça deve ter pelo menos 2 caracteres.",
    };
  }

  const existing = await raceRepository.findRaceByNome(normalizedName);

  const isDuplicate = existing.some(
    (r) =>
      r.nome_raca.trim().toLowerCase() === normalizedName.toLowerCase() &&
      r.especie_id === especieId,
  );

  if (isDuplicate) {
    return {
      success: false,
      error: "Já existe uma raça com este nome para esta espécie.",
    };
  }

  const id = await raceRepository.createRace(especieId, normalizedName);

  return { success: true, id };
}
