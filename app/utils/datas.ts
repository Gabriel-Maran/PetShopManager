// Datas do app num lugar só, sem depender do Expo, para os testes rodarem no Node. Desde a versão 3 do
// esquema, o banco, o calendário e o seletor usam o mesmo texto "AAAA-MM-DD" (DADOS-3); só os textos
// das telas usam "DD/MM/AAAA". O "hoje" segue o fuso do aparelho (BUG-7).

/** Data sem hora em "AAAA-MM-DD": o formato do banco, do calendário e do seletor. */
export type IsoDate = string;

export const INVALID_DATE_MESSAGE = "Data inválida. Escolha a data no calendário.";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const pad = (value: number) => String(value).padStart(2, "0");

/** O dia de `date` no fuso do aparelho, em "AAAA-MM-DD". */
export function dateToIso(date: Date): IsoDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Hoje no fuso do aparelho, em "AAAA-MM-DD". */
export function todayIso(now: Date = new Date()): IsoDate {
  return dateToIso(now);
}

/** "2026-11-08" → true. Confere só o formato, como o banco espera. */
export function isIsoDate(text: unknown): text is IsoDate {
  return typeof text === "string" && ISO_DATE.test(text);
}

/** "2026-11-08" → "08/11/2026" */
export function isoToBr(iso: IsoDate): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}
