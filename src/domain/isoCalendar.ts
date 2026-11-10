// Contas de calendário com datas sem hora ("AAAA-MM-DD"), puras e sem depender do Expo, para rodar
// igual no app e nos testes do Node. A conta usa o calendário UTC: somar dias ou achar o dia da semana
// nunca muda com o fuso nem com o horário de verão do aparelho. Os imports levam a extensão .ts
// porque o Node dos testes exige.
import type { IsoDate } from "../utils/datas.ts";

const pad = (value: number, length = 2) => String(value).padStart(length, "0");

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
