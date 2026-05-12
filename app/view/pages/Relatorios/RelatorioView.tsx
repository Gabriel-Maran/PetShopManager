import { RelatorioType } from "../../../config/consts";
import DiasHorasMaisAtendidas from "./DiasHorasMaisAtendidas";

export default function RelatorioView({ route }: { route: RelatorioType }) {
  switch (route) {
    case RelatorioType.DiasMovimentados:
      return <DiasHorasMaisAtendidas />;
    default:
      return <DiasHorasMaisAtendidas />;
  }
}
