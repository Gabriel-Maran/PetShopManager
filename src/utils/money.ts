// Dinheiro do app num lugar só, sem depender do Expo, para os testes rodarem no Node. Desde a versão 3
// do esquema, o banco e os modelos guardam centavos inteiros (DADOS-2); só os campos das telas usam o
// texto com vírgula ("12,50"). A conversão entre os dois acontece só aqui. Os imports levam a extensão
// .ts porque o Node dos testes exige.
import { AppError } from "../errors/AppError.ts";
import { MESSAGES } from "../globals/messages.ts";

/** Valor em centavos inteiros: 1250 é R$ 12,50. */
export type Cents = number;

// Reais, e depois da vírgula uma ou duas casas.
const MONEY_TEXT = /^(\d+)(?:,(\d{1,2}))?$/;

/** Máscara de digitação: só números e uma vírgula, com até duas casas. "R$ 80,00" → "80,00" */
export function maskMoneyInput(text: string): string {
  const [integer, ...rest] = text.replace(/[^\d,]/g, "").split(",");
  if (rest.length === 0) return integer;
  return `${integer},${rest.join("").slice(0, 2)}`;
}

/** "12,50" → 1250, "12,5" → 1250, "12" → 1200. Vazio ou fora do formato → null. */
export function moneyToCents(text: string | null | undefined): Cents | null {
  const match = MONEY_TEXT.exec((text ?? "").trim());
  if (!match) return null;
  const [, units, decimals = ""] = match;
  return Number(units) * 100 + Number(decimals.padEnd(2, "0"));
}

/** 1250 → "12,50" */
export function centsToMoney(cents: Cents): string {
  const units = Math.floor(cents / 100);
  const rest = String(cents % 100).padStart(2, "0");
  return `${units},${rest}`;
}

/** Centavos que o banco aceita: inteiro e sem sinal. */
export function isValidCents(value: unknown): value is Cents {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

/**
 * O campo de valor de um formulário → centavos. Vazio → null. Fora do formato → erro com a mensagem
 * para a tela, porque o usuário precisa corrigir o que digitou.
 */
export function parseMoneyInput(text: string | null | undefined): Cents | null {
  if (!text?.trim()) return null;
  const cents = moneyToCents(text);
  if (cents === null) throw new AppError("VALIDATION", MESSAGES.money.invalid);
  return cents;
}

/** Centavos do banco → o texto do campo de valor. Sem valor → campo vazio. */
export function formatMoneyInput(cents: Cents | null | undefined): string {
  return cents == null ? "" : centsToMoney(cents);
}
