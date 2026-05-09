export function DataNumberPraString(data: number): string {
  const s = String(data);

  const ano = s.slice(0, 4);
  const mes = s.slice(4, 6);
  const dia = s.slice(6, 8);
  return `${dia}/${mes}/${ano}`;
}

export function DataHifenPraBarra(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function DataStringPraNumber(data: string, separador: string): number {
  if (separador === "/") {
    const [dia, mes, ano] = data.split(separador);
    return Number(`${ano}${mes}${dia}`);
  } else {
    const [ano, mes, dia] = data.split(separador);
    return Number(`${ano}${mes}${dia}`);
  }
}
