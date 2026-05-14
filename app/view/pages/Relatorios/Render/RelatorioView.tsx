import { RelatorioType } from "../../../../config/consts";
import ComparativoMensal from "../ComparativoMensal";
import DiasHorasMaisAtendidas from "../DiasHorasMaisAtendidas";
import OrigemAgendamentos from "../OrigemAgendamentos";
import PetsAusentes from "../PetsAusentes";
import Remarcacoes from "../Remarcacoes";

export default function RelatorioView({ route }: { route: RelatorioType }) {
  switch (route) {
    case RelatorioType.DiasHorasMovimentados:
      return <DiasHorasMaisAtendidas />;
    case RelatorioType.OrigemAgendamentos:
      return <OrigemAgendamentos />;
    case RelatorioType.PetsAusentes:
      return <PetsAusentes />;
    case RelatorioType.Remarcacoes:
      return <Remarcacoes />;
    case RelatorioType.ComparativoMensal:
      return <ComparativoMensal />;
    case RelatorioType.Pacotes:
      return <OrigemAgendamentos />;
    case RelatorioType.TaxaConclusao:
      return <OrigemAgendamentos />;
    default:
      return <DiasHorasMaisAtendidas />;
  }
}
