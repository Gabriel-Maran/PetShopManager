// A entrada passa pelo schema antes de chegar ao banco, e a falha do Zod vira o AppError do app
// (VALID-1). Sem depender do Expo, para os testes rodarem no Node, que exige a extensão .ts nos imports.
import * as z from "zod";
import { AppError } from "../errors/AppError.ts";
import { MESSAGES } from "../globals/messages.ts";
import { id } from "./fields.ts";

/** A mensagem de toda falha que o schema não nomeia, no lugar do texto do Zod, em inglês. */
const unexpectedInput = () => MESSAGES.invalidInput;

const recordId = id();

/**
 * Confere `input` pelo `schema` e devolve o dado limpo: texto sem espaço nas pontas, campo opcional
 * vazio como null e nenhum campo fora do schema.
 *
 * A falha vira um AppError com a mensagem do primeiro campo errado, que o usuário corrige e tenta de
 * novo; essa é prevista e não vai para o log. Uma falha sem mensagem própria (tipo errado, campo
 * ausente, entrada que não é objeto) não vem do que o usuário digitou, e sim de um defeito de quem
 * chamou: a tela mostra a mensagem genérica, e o detalhe do Zod segue no `cause`, para o logError.
 */
export function parseInput<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input, { error: unexpectedInput });
  if (result.success) return result.data;

  const { message } = result.error.issues[0];
  const isUnexpected = message === MESSAGES.invalidInput;
  throw new AppError("VALIDATION", message, isUnexpected ? { cause: result.error } : undefined);
}

/**
 * O id de um registro que a tela abriu. Um id fora do formato não pode existir no banco, então a
 * resposta é a mesma de um registro que não existe.
 */
export function parseRecordId(value: unknown, notFoundMessage: string): number {
  const result = recordId.safeParse(value);
  if (!result.success) throw new AppError("NOT_FOUND", notFoundMessage);
  return result.data;
}
