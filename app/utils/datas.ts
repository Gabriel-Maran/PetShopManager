// Datas do app num lugar só, sem depender do Expo, para os testes rodarem no Node. O banco guarda a
// data como número AAAAMMDD; o calendário e o seletor usam "AAAA-MM-DD"; os textos das telas usam
// "DD/MM/AAAA". O "hoje" segue o fuso do aparelho (BUG-7).

/** Data no formato do banco: o número AAAAMMDD. */
export type DbDate = number;

const pad = (value: number) => String(value).padStart(2, "0");

/** Hoje no fuso do aparelho, em "AAAA-MM-DD". */
export function todayIso(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Hoje no fuso do aparelho, no formato do banco. */
export function todayDb(now: Date = new Date()): DbDate {
  return isoToDb(todayIso(now));
}

/** 20261108 → "2026-11-08" */
export function dbToIso(data: DbDate): string {
  const text = String(data);
  return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
}

/** 20261108 → "08/11/2026" */
export function dbToBr(data: DbDate): string {
  return isoToBr(dbToIso(data));
}

/** "2026-11-08" → "08/11/2026" */
export function isoToBr(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

/** "2026-11-08" → 20261108 */
export function isoToDb(iso: string): DbDate {
  const [year, month, day] = iso.split("-");
  return Number(`${year}${month}${day}`);
}

/** "08/11/2026" → 20261108 */
export function brToDb(br: string): DbDate {
  const [day, month, year] = br.split("/");
  return Number(`${year}${month}${day}`);
}
