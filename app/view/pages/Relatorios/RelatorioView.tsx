import { RelatorioType } from "../../../config/consts";
import DiasMaisAtendidos from "./DiasMaisAtendidos";

export default function RelatorioView({ route }: { route: RelatorioType }) {
  switch (route) {
    case RelatorioType.DiasMovimentados:
      return <DiasMaisAtendidos />;
    default:
      return <DiasMaisAtendidos />;
  }
}
