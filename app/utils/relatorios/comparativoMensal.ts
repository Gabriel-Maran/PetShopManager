import { getDatabase } from "../../config/database";
import { APPOINTMENTS_BY_MONTH_SQL } from "../../repository/sql/relatoriosSql";
import { BarChartItem } from "../../view/components/Relatorios/BarChart";
import { dateToIso, type IsoDate, todayIso } from "../datas";

const MESES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export interface ComparativoMensalItem extends BarChartItem {
  // x = "Abr/25"   y = total de atendimentos
  anoMes: string; // "AAAA-MM", útil para um detalhe do mês no futuro
}

/** `quantidade` meses seguidos a partir do mês de `primeiro`, como "AAAA-MM". */
function mesesAPartirDe(primeiro: Date, quantidade: number): string[] {
  return Array.from({ length: quantidade }, (_, i) =>
    dateToIso(new Date(primeiro.getFullYear(), primeiro.getMonth() + i, 1)).slice(0, 7),
  );
}

/** "2025-04" → "Abr/25" */
function formatarMes(anoMes: string): string {
  const mes = Number(anoMes.slice(5, 7)) - 1;
  return `${MESES[mes]}/${anoMes.slice(2, 4)}`;
}

/** Conta os atendimentos de cada mês da lista, com 0 nos meses sem nenhum. */
async function contarPorMes(
  concluido: 0 | 1,
  meses: string[],
  de: IsoDate,
  ate: IsoDate,
): Promise<ComparativoMensalItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ ano_mes: string; total: number }>(
    APPOINTMENTS_BY_MONTH_SQL,
    [concluido, de, ate],
  );

  const mapa = new Map(rows.map((r) => [r.ano_mes, r.total]));
  return meses.map((anoMes) => ({
    x: formatarMes(anoMes),
    y: mapa.get(anoMes) ?? 0,
    anoMes,
  }));
}

/** Atendimentos concluídos nos últimos `meses` meses, contando o atual. */
export async function getComparativoMensal(
  meses = 12,
): Promise<ComparativoMensalItem[]> {
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth() - (meses - 1), 1);
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  return contarPorMes(
    1,
    mesesAPartirDe(primeiroDia, meses),
    dateToIso(primeiroDia),
    dateToIso(ultimoDia),
  );
}

/** Atendimentos pendentes de hoje até o fim dos próximos `meses` meses, contando o atual. */
export async function getComparativoMensalAgendados(
  meses = 12,
): Promise<ComparativoMensalItem[]> {
  const hoje = new Date();
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + meses, 0);

  return contarPorMes(
    0,
    mesesAPartirDe(hoje, meses),
    todayIso(hoje),
    dateToIso(ultimoDia),
  );
}
