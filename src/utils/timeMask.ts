/**
 * Máscara do campo de horário, aplicada a cada tecla: "1430" → "14:30". Uma hora acima de 23 vira 23,
 * e um minuto acima de 59 vira 59, para o campo nunca mostrar um horário que não existe.
 */
export function maskTime(text: string): string {
  const digits = text.replace(/\D/g, "");
  if (!digits || digits.length > 4) return "";
  const hour = clamp(digits.slice(0, 2), 23);
  if (digits.length <= 2) return hour;
  return `${hour}:${clamp(digits.slice(2), 59)}`;
}

/** O número digitado, limitado ao máximo, com os mesmos dígitos que o usuário vê. */
const clamp = (value: string, max: number): string => (Number(value) > max ? String(max) : value);
