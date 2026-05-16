import { RelatorioType } from "../../../../config/consts";
import ComparativoMensal from "../ComparativoMensal";
import DiasHorasMaisAtendidas from "../DiasHorasMaisAtendidas";
import OrigemAgendamentos from "../OrigemAgendamentos";
import PetsAusentes from "../PetsAusentes";
import RemarcacoesIntervals from "../RemarcacoesIntervals";
import PlanosAtivos from "../PlanosAtivosTipos";

export default function RelatorioView({ route }: { route: RelatorioType }) {
  switch (route) {
    case RelatorioType.DiasHorasMovimentados:
      return <DiasHorasMaisAtendidas />;
    case RelatorioType.OrigemAgendamentos:
      return <OrigemAgendamentos />;
    case RelatorioType.PetsAusentes:
      return <PetsAusentes />;
    case RelatorioType.Remarcacoes:
      return <RemarcacoesIntervals />;
    case RelatorioType.ComparativoMensal:
      return <ComparativoMensal />;
    case RelatorioType.Pacotes:
      return <PlanosAtivos />;
    default:
      return <DiasHorasMaisAtendidas />;
  }
}
