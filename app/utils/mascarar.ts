export function mascararHorario(txt: string): string {
  // ESSE BICHÃO MÁSCARA HORÁRIO
  // ELA TAMBÉM TRANSFORMA A HORA CASO SEJA > 23 
  // E O MINUTO CASO > 59
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

export function numeroComVirgula(txtValor: string) {
  let valor = txtValor.replace(/[^\d,]/g, "");

  const partes = valor.split(",");

  if (partes.length > 2) {
    valor = partes[0] + "," + partes.slice(1).join("");
  }

  const [inteiro, decimal] = valor.split(",");

  if (decimal !== undefined) {
    return inteiro + "," + decimal.slice(0, 2);
  }

  return valor;
}
