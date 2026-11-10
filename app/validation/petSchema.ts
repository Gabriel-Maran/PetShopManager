// O cadastro do pet e o pacote de remarcação (VALID-1). Sem depender do Expo, para os testes rodarem
// no Node, que exige a extensão .ts nos imports.
import * as z from "zod";
import type { PacoteRemarcacao, PorteAnimal, TipoServico } from "../config/consts";
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

/**
 * Os enums do pet. Eles ficam em consts.ts, que importa o React Native e não roda no Node: o app
 * passa os enums, e os testes passam objetos com os mesmos valores.
 */
export interface PetEnums {
  porte: typeof PorteAnimal;
  servico: typeof TipoServico;
  pacote: typeof PacoteRemarcacao;
}

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

/** O schema do cadastro do pet e o da troca só do pacote, criados com os enums do app. */
export function createPetSchemas(enums: PetEnums) {
  const packageShape = {
    remarcacao_ativa: flag("Remarcação ativa"),
    pacote_remarcacao: optional(choice(enums.pacote, "Pacote de remarcação")),
    valor_pacote: optional(cents(MESSAGES.money.invalid)),
    data_inicio_pacote: optional(isoDate(MESSAGES.date.invalid)),
  };

  const pet = z
    .object({
      nome: requiredText(MAX_PET_NAME_LENGTH, {
        required: MESSAGES.pet.nameRequired,
        tooLong: MESSAGES.textTooLong("O nome do pet", MAX_PET_NAME_LENGTH),
      }),
      especie: id(MESSAGES.pet.speciesRequired),
      dono_id: id(MESSAGES.pet.ownerRequired),
      porte: choice(enums.porte, "Porte"),
      raca: id(MESSAGES.pet.breedRequired),
      servico_padrao: choice(enums.servico, "Serviço padrão"),
      observacoes: optional(
        text(MAX_NOTES_LENGTH, MESSAGES.textTooLong("A observação do pet", MAX_NOTES_LENGTH)),
      ),
      is_ativo: flag("Ativo"),
      ...packageShape,
      horario_padrao: withDefault(time(MESSAGES.pet.defaultTimeInvalid), DEFAULT_TIME),
    })
    .superRefine(requirePackageWhenActive);

  const remarcacao = z.object(packageShape).superRefine(requirePackageWhenActive);

  return { pet, remarcacao };
}

type PetSchemas = ReturnType<typeof createPetSchemas>;

/** O pet conferido: o que o service recebe para gravar. */
export type PetData = z.output<PetSchemas["pet"]>;

/** O pacote de remarcação conferido, para trocar só o pacote. */
export type PetRemarcacaoData = z.output<PetSchemas["remarcacao"]>;
