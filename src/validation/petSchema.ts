// O cadastro do pet e o pacote de remarcação (VALID-1). Sem depender do Expo, para os testes rodarem
// no Node, que exige a extensão .ts nos imports.
import * as z from "zod";
import { PackageFrequency, PetSize, ServiceName } from "../config/petEnums.ts";
import { MESSAGES } from "../globals/messages.ts";
import { MAX_NOTES_LENGTH, MAX_PET_NAME_LENGTH } from "../globals/limits.ts";
import {
  cents,
  choice,
  flag,
  id,
  isoDate,
  optional,
  requiredText,
  text,
  time,
  withDefault,
} from "./fields.ts";

/** O horário padrão vazio fica 00:00, o mesmo padrão da coluna no banco. */
const DEFAULT_TIME = "00:00";

/** O que a regra do pacote olha: se a remarcação está ligada e quais campos do pacote vieram vazios. */
type PackageFields = { reschedule_active: number } & Record<
  "package_frequency" | "package_price" | "package_start_date",
  unknown
>;

/** Com a remarcação ligada, o pacote, o valor e o início são obrigatórios. Sem ela, podem ficar vazios. */
function requirePackageWhenActive(fields: PackageFields, ctx: z.core.$RefinementCtx): void {
  if (fields.reschedule_active !== 1) return;
  const required = [
    ["package_frequency", MESSAGES.pet.packageRequired],
    ["package_price", MESSAGES.pet.packageValueRequired],
    ["package_start_date", MESSAGES.pet.packageStartRequired],
  ] as const;
  for (const [field, message] of required) {
    if (fields[field] === null) ctx.addIssue({ code: "custom", message, path: [field] });
  }
}

/** Os textos do pet que já estão gravados, para a edição não recusar o que não mudou. */
export interface StoredPetTexts {
  notes?: string | null;
}

/**
 * O cadastro do pet, com o pacote de remarcação. Na edição, recebe o que está gravado: o limite da
 * observação vale só para o que mudou (a nota da migração pode ter passado dele).
 */
export const petSchemaFor = (stored: StoredPetTexts = {}) =>
  z
    .object({
      name: requiredText(MAX_PET_NAME_LENGTH, {
        required: MESSAGES.pet.nameRequired,
        tooLong: MESSAGES.textTooLong("O nome do pet", MAX_PET_NAME_LENGTH),
      }),
      species_id: id(MESSAGES.pet.speciesRequired),
      owner_id: id(MESSAGES.pet.ownerRequired),
      size: choice(PetSize, "Porte"),
      breed_id: id(MESSAGES.pet.breedRequired),
      default_service: choice(ServiceName, "Serviço padrão"),
      notes: optional(
        text(
          MAX_NOTES_LENGTH,
          MESSAGES.textTooLong("A observação do pet", MAX_NOTES_LENGTH),
          stored.notes,
        ),
      ),
      is_active: flag("Ativo"),
      reschedule_active: flag("Remarcação ativa"),
      package_frequency: optional(choice(PackageFrequency, "Pacote de remarcação")),
      package_price: optional(cents(MESSAGES.money.invalid)),
      package_start_date: optional(isoDate(MESSAGES.date.invalid)),
      default_time: withDefault(time(MESSAGES.pet.defaultTimeInvalid), DEFAULT_TIME),
    })
    .superRefine(requirePackageWhenActive);

/** O schema da criação, sem nada gravado. */
export const petSchema = petSchemaFor();

/** O pet conferido: o que o service recebe para gravar. */
export type PetData = z.output<typeof petSchema>;
