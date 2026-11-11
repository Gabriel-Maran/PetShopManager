// O cadastro do dono (VALID-1). Sem depender do Expo, para os testes rodarem no Node, que exige a
// extensão .ts nos imports.
import * as z from "zod";
import { MESSAGES } from "../globals/messages.ts";
import {
  MAX_ADDRESS_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_OWNER_NAME_LENGTH,
  MAX_PHONE_LENGTH,
} from "../globals/limits.ts";
import { flag, optional, requiredText, text } from "./fields.ts";

/** Só os caracteres da máscara do telefone: dígitos, espaço, parênteses e hífen. */
const PHONE_CHARACTERS = /^[\d\s()-]+$/;

/** DDD e número, com 10 ou 11 dígitos; o celular de 11 tem o 9 logo depois do DDD. */
function isValidPhone(phone: string): boolean {
  if (!PHONE_CHARACTERS.test(phone)) return false;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  return digits.length === 10 || digits[2] === "9";
}

export const ownerSchema = z.object({
  name: requiredText(MAX_OWNER_NAME_LENGTH, {
    required: MESSAGES.owner.nameRequired,
    tooLong: MESSAGES.textTooLong("O nome do dono", MAX_OWNER_NAME_LENGTH),
  }),
  phone: text(MAX_PHONE_LENGTH, MESSAGES.owner.phoneInvalid)
    .min(1, MESSAGES.owner.phoneRequired)
    .refine(isValidPhone, MESSAGES.owner.phoneInvalid),
  email: optional(
    text(MAX_EMAIL_LENGTH, MESSAGES.textTooLong("O e-mail", MAX_EMAIL_LENGTH)).regex(
      z.regexes.email,
      MESSAGES.owner.emailInvalid,
    ),
  ),
  address: optional(
    text(MAX_ADDRESS_LENGTH, MESSAGES.textTooLong("O endereço", MAX_ADDRESS_LENGTH)),
  ),
  is_active: flag("Ativo"),
});

/** O dono conferido: o que o service recebe para gravar. */
export type OwnerData = z.output<typeof ownerSchema>;
