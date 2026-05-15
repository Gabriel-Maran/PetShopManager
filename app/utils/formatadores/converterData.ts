// Tirar o Number do banco e transformar em String pra exibir = DD/MM/AAAA
export function DataNumberPraString(data: number): string {
  const s = String(data);

  const ano = s.slice(0, 4);
  const mes = s.slice(4, 6);
  const dia = s.slice(6, 8);
  return `${dia}/${mes}/${ano}`;
}

// Transformar em Number pra salvar no banco = AAAAMMDD
export function DataStringPraNumber(data: string, separador: string): number {
  if (separador === "/") {
    const [dia, mes, ano] = data.split(separador);
    return Number(`${ano}${mes}${dia}`);
  } else {
    const [ano, mes, dia] = data.split(separador);
    return Number(`${ano}${mes}${dia}`);
  }
}

// Transformar em String contendo Hífen pra usar no calendário = AAAA-MM-DD
export function DataNumberPraStringHifen(data: number): string {
  const s = String(data);

  const ano = s.slice(0, 4);
  const mes = s.slice(4, 6);
  const dia = s.slice(6, 8);
  return `${ano}-${mes}-${dia}`;
}

// Trocar o Hífen que tem na data selecionada no calendário por barra = DD/MM/AAAA
export function DataHifenPraBarra(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}
