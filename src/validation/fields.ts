// Os campos que os schemas de cada entidade montam (VALID-1). Cada campo recebe a mensagem de cada
// falha que o usuário pode corrigir; o tipo errado ou o campo ausente ficam sem mensagem, e o
// parseInput mostra a genérica. Sem depender do Expo, para os testes rodarem no Node, que exige a
// extensão .ts nos imports.
import * as z from "zod";
import { isIsoDate } from "../utils/dates.ts";
import { isValidCents } from "../utils/money.ts";
import { MAX_STORED_TEXT_LENGTH } from "../globals/limits.ts";
import { MESSAGES } from "../globals/messages.ts";

/** Horas de 00 a 23 e minutos de 00 a 59, sempre com dois dígitos: "09:30". */
const HOUR_MINUTE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Vazio, só espaços, nulo ou ausente viram null; texto chega ao schema sem espaço nas pontas. */
function blankToNull(value: unknown): unknown {
  if (typeof value === "string") return value.trim() || null;
  return value ?? null;
}

/** Campo opcional: o que estiver vazio vira null, e o resto passa pelo `schema`. */
export const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(blankToNull, schema.nullable());

/** Campo com valor padrão: o que estiver vazio vira `fallback`, e tudo passa pelo `schema`. */
export const withDefault = <T extends z.ZodType>(schema: T, fallback: z.input<T>) =>
  z.preprocess((value) => blankToNull(value) ?? fallback, schema);

/**
 * Texto com no máximo `max` caracteres, sem espaço nas pontas. O tamanho é conferido primeiro e
 * interrompe o resto: um texto gigante não chega às outras regras.
 *
 * Na edição, `stored` é o texto que já está gravado. O limite vale só para o que mudou: um texto igual
 * ao gravado passa mesmo acima de `max` (a nota da migração engorda a observação, e o nome de um item
 * oculto pode ser maior que o permitido hoje), com o teto de MAX_STORED_TEXT_LENGTH. Sem `stored`
 * (criação), nada muda.
 */
export function text(max: number, tooLong: string, stored?: string | null) {
  const trimmed = z.string().trim();
  if (stored == null) return trimmed.max(max, { error: tooLong, abort: true });
  const unchanged = stored.trim();
  return trimmed
    .max(MAX_STORED_TEXT_LENGTH, { error: tooLong, abort: true })
    .refine((value) => value.length <= max || value === unchanged, { error: tooLong, abort: true });
}

/** Texto que não pode ficar vazio nem só com espaços. */
export const requiredText = (
  max: number,
  messages: { required: string; tooLong: string },
  stored?: string | null,
) => text(max, messages.tooLong, stored).min(1, messages.required);

/** O id de um registro: inteiro positivo. */
export const id = (message?: string) => z.int().positive(message);

/** Sim ou não, guardado como 0 ou 1 no banco. */
export const flag = (field: string) => z.literal([0, 1], MESSAGES.invalidFlag(field));

/** Um valor da lista `values` (um enum do app). A mensagem mostra os valores aceitos. */
export function choice<const T extends z.core.util.EnumLike>(values: T, field: string) {
  const accepted = z.enum(values).options;
  return z.enum(values, MESSAGES.invalidOption(field, accepted));
}

/** Data sem hora, no formato do banco ("AAAA-MM-DD"), de um dia que existe no calendário. */
export const isoDate = (message: string) => z.string().refine(isIsoDate, message);

/** Horário "HH:MM", de 00:00 a 23:59. Com `required`, o vazio tem a sua mensagem. */
export function time(invalid: string, required?: string) {
  const trimmed = z.string().trim();
  const filled = required ? trimmed.min(1, { error: required, abort: true }) : trimmed;
  return filled.regex(HOUR_MINUTE, invalid);
}

/** Valor em centavos inteiros e sem sinal, como o banco guarda. */
export const cents = (message: string) => z.number().refine(isValidCents, message);
