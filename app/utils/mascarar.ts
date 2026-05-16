export default function Mascarar(txt: string, tipo: number) : string {
  //ESSE BICHÃO MÁSCARA HORÁRIO
  if (tipo === 2) {
    const d = txt.replace(/\D/g, "");
    if (!d) return "";
    if (d.length <= 2) {
      return d;
    }
    if (d.length <= 4) {
      return `${d.slice(0, 2)}:${d.slice(2, 4)}`;
    }
    return `${d.slice(0, 2)}:${d.slice(2, 4)}`;
  };
  return ""
}
