// Datas do app num lugar só, sem depender do Expo, para os testes rodarem no Node. Desde a versão 3 do
// esquema, o banco, o calendário e o seletor usam o mesmo texto "AAAA-MM-DD" (DADOS-3); só os textos
// das telas usam "DD/MM/AAAA". O "hoje" segue o fuso do aparelho (BUG-7). As contas de calendário
// (somar dias, dia da semana, mês seguinte) usam o calendário UTC, para nunca mudar com o fuso nem
// com o horário de verão.

/** Data sem hora em "AAAA-MM-DD": o formato do banco, do calendário e do seletor. */
export type IsoDate = string;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const pad = (value: number, length = 2) => String(value).padStart(length, "0");

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

// O setUTCFullYear, e não o Date.UTC, porque o Date.UTC lê os anos 0 a 99 como 1900 a 1999.
function toUtc(date: IsoDate): Date {
  const [year, month, day] = date.split("-").map(Number);
  const utc = new Date(0);
  utc.setUTCFullYear(year, month - 1, day);
  return utc;
}

function fromUtc(utc: Date): IsoDate {
  return `${pad(utc.getUTCFullYear(), 4)}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
}

/** "2026-01-28" + 7 → "2026-02-04". Dias negativos voltam no calendário. */
export function addDays(date: IsoDate, days: number): IsoDate {
  const utc = toUtc(date);
  utc.setUTCDate(utc.getUTCDate() + days);
  return fromUtc(utc);
}

/** "2026-11-08" → "2026-11", a chave para comparar meses. */
export const monthOf = (date: IsoDate): string => date.slice(0, 7);

/** O dia da semana, como o strftime('%w') do SQLite: 0 é domingo e 6 é sábado. */
export const weekdayOf = (date: IsoDate): number => toUtc(date).getUTCDay();

/** O primeiro dia do mês seguinte ao de `date`: "2026-12-31" → "2027-01-01". */
export function firstDayOfNextMonth(date: IsoDate): IsoDate {
  const utc = toUtc(date);
  // O dia 1 vem antes do mês: somar um mês a 31/01 daria 03/03.
  utc.setUTCDate(1);
  utc.setUTCMonth(utc.getUTCMonth() + 1);
  return fromUtc(utc);
}

/** A primeira data do mês seguinte ao de `date` que cai no dia da semana `weekday` (0 = domingo). */
export function sameWeekdayInNextMonth(date: IsoDate, weekday: number): IsoDate {
  const firstDay = firstDayOfNextMonth(date);
  return addDays(firstDay, (weekday - weekdayOf(firstDay) + 7) % 7);
}
