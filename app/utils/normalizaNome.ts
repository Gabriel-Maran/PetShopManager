export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD") // decompõe: "ã" → "a" + "̃"
    .replace(/[\u0300-\u036f]/g, "") // remove os diacríticos (acentos)
    .toLowerCase()
    .trim();
}
