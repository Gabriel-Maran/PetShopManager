// Datas do app num lugar só, sem depender do Expo, para os testes rodarem no Node. Desde a versão 3 do
// esquema, o banco, o calendário e o seletor usam o mesmo texto "AAAA-MM-DD" (DADOS-3); só os textos
// das telas usam "DD/MM/AAAA". O "hoje" segue o fuso do aparelho (BUG-7).

/** Data sem hora em "AAAA-MM-DD": o formato do banco, do calendário e do seletor. */
export type IsoDate = string;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const pad = (value: number) => String(value).padStart(2, "0");

/** O dia de `date` no fuso do aparelho, em "AAAA-MM-DD". */
export function dateToIso(date: Date): IsoDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Hoje no fuso do aparelho, em "AAAA-MM-DD". */
export function todayIso(now: Date = new Date()): IsoDate {
  return dateToIso(now);
}

/**
 * "AAAA-MM-DD" de um dia que existe: 2024-02-29 passa; 2025-02-29, 2026-02-30 e 2026-13-01 não. Lê só
 * os números do texto, sem `Date`, para o resultado não depender do fuso do aparelho.
 */
export function isIsoDate(text: unknown): text is IsoDate {
  if (typeof text !== "string" || !ISO_DATE.test(text)) return false;
  const [year, month, day] = text.split("-").map(Number);
  if (month < 1 || month > 12) return false;
  const lastDay = month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];
  return day >= 1 && day <= lastDay;
}

/** "2026-11-08" → "08/11/2026" */
export function isoToBr(iso: IsoDate): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}
