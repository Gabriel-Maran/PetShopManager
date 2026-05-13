import { RelatorioType } from "../../../config/consts";
import DiasHorasMaisAtendidas from "./DiasHorasMaisAtendidas";
import OrigemAgendamentos from "./OrigemAgendamentos";

export default function RelatorioView({ route }: { route: RelatorioType }) {
  switch (route) {
    case RelatorioType.DiasHorasMovimentados:
      return <DiasHorasMaisAtendidas />;
    case RelatorioType.OrigemAgendamentos:
      return <OrigemAgendamentos />;
    default:
      return <DiasHorasMaisAtendidas />;
  }
}
