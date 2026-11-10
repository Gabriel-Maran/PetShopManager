// O cadastro do pet e o pacote de remarcação (VALID-1). Sem depender do Expo, para os testes rodarem
// no Node, que exige a extensão .ts nos imports.
import * as z from "zod";
import { PacoteRemarcacao, PorteAnimal, TipoServico } from "../config/petEnums.ts";
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
type PackageFields = { remarcacao_ativa: number } & Record<
  "pacote_remarcacao" | "valor_pacote" | "data_inicio_pacote",
  unknown
>;

/** Com a remarcação ligada, o pacote, o valor e o início são obrigatórios. Sem ela, podem ficar vazios. */
function requirePackageWhenActive(fields: PackageFields, ctx: z.core.$RefinementCtx): void {
  if (fields.remarcacao_ativa !== 1) return;
  const required = [
    ["pacote_remarcacao", MESSAGES.pet.packageRequired],
    ["valor_pacote", MESSAGES.pet.packageValueRequired],
    ["data_inicio_pacote", MESSAGES.pet.packageStartRequired],
  ] as const;
  for (const [field, message] of required) {
    if (fields[field] === null) ctx.addIssue({ code: "custom", message, path: [field] });
  }
}

/** O cadastro do pet, com o pacote de remarcação. */
export const petSchema = z
  .object({
    nome: requiredText(MAX_PET_NAME_LENGTH, {
      required: MESSAGES.pet.nameRequired,
      tooLong: MESSAGES.textTooLong("O nome do pet", MAX_PET_NAME_LENGTH),
    }),
    especie: id(MESSAGES.pet.speciesRequired),
    dono_id: id(MESSAGES.pet.ownerRequired),
    porte: choice(PorteAnimal, "Porte"),
    raca: id(MESSAGES.pet.breedRequired),
    servico_padrao: choice(TipoServico, "Serviço padrão"),
    observacoes: optional(
      text(MAX_NOTES_LENGTH, MESSAGES.textTooLong("A observação do pet", MAX_NOTES_LENGTH)),
    ),
    is_ativo: flag("Ativo"),
    remarcacao_ativa: flag("Remarcação ativa"),
    pacote_remarcacao: optional(choice(PacoteRemarcacao, "Pacote de remarcação")),
    valor_pacote: optional(cents(MESSAGES.money.invalid)),
    data_inicio_pacote: optional(isoDate(MESSAGES.date.invalid)),
    horario_padrao: withDefault(time(MESSAGES.pet.defaultTimeInvalid), DEFAULT_TIME),
  })
  .superRefine(requirePackageWhenActive);

/** O pet conferido: o que o service recebe para gravar. */
export type PetData = z.output<typeof petSchema>;
