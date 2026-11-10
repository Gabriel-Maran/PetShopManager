/**
 * Máscara do campo de horário, aplicada a cada tecla: "1430" → "14:30". Uma hora acima de 23 vira 23,
 * e um minuto acima de 59 vira 59, para o campo nunca mostrar um horário que não existe.
 */
export function mascararHorario(txt: string): string {
  const d = txt.replace(/\D/g, "");
  if (!d) return "";
  if (d.length <= 2) {
    let hora = d.slice(0, 2);
    if (Number(hora) > 23) {
      hora = "23";
    }
    return hora;
  }
  if (d.length <= 4) {
    let hora = d.slice(0, 2);
    if (Number(hora) > 23) {
      hora = "23";
    }

    let minuto = d.slice(2, 4);
    if (Number(minuto) > 59) {
      minuto = "59";
    }
    return `${hora}:${minuto}`;
  }
  return "";
}
