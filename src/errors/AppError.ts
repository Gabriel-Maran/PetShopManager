// Erros do app num lugar só (ERRO-1): aqui eles são criados, registrados no log e convertidos no texto
// da tela. Sem depender do Expo, para os testes rodarem no Node, que exige a extensão .ts nos imports.
import { MESSAGES } from "../globals/messages.ts";

/** O tipo da falha, para quem a recebe decidir o que fazer além de mostrar a mensagem. */
export type ErrorCode =
  /** Entrada do usuário fora da regra: ele corrige o formulário e tenta de novo. */
  | "VALIDATION"
  /** O registro não existe mais. */
  | "NOT_FOUND"
  /** Já existe, ou o estado do app não permite agora (raça repetida, app com dados). */
  | "CONFLICT"
  /** O arquivo escolhido não é um backup que o app consegue importar. */
  | "INVALID_BACKUP"
  /** A versão ou a migração do banco do aparelho. */
  | "DATABASE"
  /** Um recurso que o aparelho ou o modo de execução não oferece. */
  | "UNAVAILABLE";

/**
 * Falha prevista, com uma mensagem de `MESSAGES` que o usuário pode ler. Qualquer outro erro (um bug,
 * o SQLite, o Expo) aparece na tela com a mensagem genérica, e os detalhes ficam só no log.
 */
export class AppError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AppError";
    this.code = code;
    // Mantém o instanceof certo mesmo se o Babel converter a classe para uma versão antiga do JS.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** O texto para a tela. Só o AppError mostra a própria mensagem; o resto vira o `fallback`. */
export function toUserMessage(error: unknown, fallback: string = MESSAGES.unexpected): string {
  return isAppError(error) ? error.message : fallback;
}

/**
 * Registra no log o que a tela não mostra: o erro inesperado inteiro, ou o motivo (`cause`) de um
 * AppError. Uma falha de validação é prevista e não vai para o log.
 */
export function logError(error: unknown, context?: string): void {
  if (isAppError(error) && error.cause === undefined) return;
  const label = `[${context ?? "erro"}]`;
  // O console do React Native mostra só a mensagem do erro, sem o `cause`. Sem ele à parte, uma
  // migração que falha no aparelho aparece só como "a atualização falhou".
  const cause = error instanceof Error ? error.cause : undefined;
  if (cause === undefined) console.error(label, error);
  else console.error(label, error, "Causa:", cause);
}
