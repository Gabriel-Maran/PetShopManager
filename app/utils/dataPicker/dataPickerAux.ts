/** "20240715" → "2024-07-15" */
export function intParaHifen(data: number | string): string {
  const s = String(data);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

/** "2024-07-15" → "15/07/2024" */
export function hifen_para_br(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Data de hoje no fuso de São Paulo, formato "YYYY-MM-DD" */
export function hoje(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
}
