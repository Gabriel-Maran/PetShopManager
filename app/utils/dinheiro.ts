// Dinheiro do app num lugar só, sem depender do Expo, para os testes rodarem no Node. Hoje o banco
// guarda o valor como texto com vírgula ("12,50"); na versão 3 do esquema, passa a guardar centavos
// inteiros (DADOS-2). As telas e os controllers usam só estas funções, para a troca mudar um lugar só.

/** Valor em centavos inteiros: 1250 é R$ 12,50. */
export type Cents = number;

export const INVALID_MONEY_MESSAGE = "Valor inválido. Use só números e vírgula, como 120,00.";

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
  const [, reais, decimals = ""] = match;
  return Number(reais) * 100 + Number(decimals.padEnd(2, "0"));
}

/** 1250 → "12,50" */
export function centsToMoney(cents: Cents): string {
  const reais = Math.floor(cents / 100);
  const rest = String(cents % 100).padStart(2, "0");
  return `${reais},${rest}`;
}

/** O valor digitado no formato que vai para o banco: "12,5" → "12,50". Vazio ou inválido → null. */
export function normalizeMoney(text: string | null | undefined): string | null {
  const cents = moneyToCents(text);
  return cents === null ? null : centsToMoney(cents);
}
