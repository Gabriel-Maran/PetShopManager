// Os meses do comparativo mensal, contados pelo calendário do aparelho. Sem o Expo, para os testes
// rodarem no Node.
import { dateToIso, type IsoDate, todayIso } from "../datas.ts";
import type { BarSpec } from "./graficos.ts";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** O intervalo de datas que o banco conta e uma barra para cada mês dele, mesmo os sem atendimento. */
export interface MonthRange {
  from: IsoDate;
  to: IsoDate;
  bars: BarSpec<string>[];
}

/** "2025-04" → "Abr/25" */
function formatMonth(yearMonth: string): string {
  const month = Number(yearMonth.slice(5, 7)) - 1;
  return `${MONTH_LABELS[month]}/${yearMonth.slice(2, 4)}`;
}

/** `count` meses seguidos a partir do mês de `first`, com o grupo "AAAA-MM" e o rótulo. */
function monthBars(first: Date, count: number): BarSpec<string>[] {
  return Array.from({ length: count }, (_, i) => {
    // O dia 1 evita que um dia 29 a 31 pule para o mês seguinte ao somar os meses.
    const yearMonth = dateToIso(new Date(first.getFullYear(), first.getMonth() + i, 1)).slice(0, 7);
    return [yearMonth, formatMonth(yearMonth)] as const;
  });
}

/** Os últimos `count` meses, contando o atual: do dia 1 do primeiro ao último dia do mês de hoje. */
export function lastMonthsRange(today: Date, count: number): MonthRange {
  const firstDay = new Date(today.getFullYear(), today.getMonth() - (count - 1), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { from: dateToIso(firstDay), to: dateToIso(lastDay), bars: monthBars(firstDay, count) };
}

/** Os próximos `count` meses, contando o atual: de hoje ao último dia do último mês. */
export function nextMonthsRange(today: Date, count: number): MonthRange {
  const lastDay = new Date(today.getFullYear(), today.getMonth() + count, 0);
  return { from: todayIso(today), to: dateToIso(lastDay), bars: monthBars(today, count) };
}
