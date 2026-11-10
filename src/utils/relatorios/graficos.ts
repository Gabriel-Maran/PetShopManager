// Contagens do banco viram as barras dos relatórios. Sem o Expo, para os testes rodarem no Node.
import { PacoteRemarcacao } from "../../config/petEnums.ts";
import type { BarChartItem } from "../../view/components/Relatorios/BarChart";

/** Uma linha das contagens dos relatórios (src/repository/sql/relatoriosSql.ts): o grupo e quantos. */
export interface GroupCount<K extends number | string> {
  category: K;
  total: number;
}

/** Uma barra do gráfico: o grupo como vem do banco e o rótulo que a tela mostra. */
export type BarSpec<K extends number | string> = readonly [category: K, label: string];

/**
 * Uma barra por grupo, na ordem de `bars`. O grupo sem nenhuma linha no banco aparece com 0, para o
 * gráfico mostrar sempre as mesmas barras.
 */
export function countsToBars<K extends number | string>(
  rows: readonly GroupCount<K>[],
  bars: readonly BarSpec<K>[],
): BarChartItem[] {
  const totals = new Map(rows.map((row) => [row.category, row.total]));
  return bars.map(([category, label]) => ({ x: label, y: totals.get(category) ?? 0 }));
}

/** O `dia_semana` do banco vai de 0 (domingo) a 6 (sábado), como o `strftime('%w')`. */
export const WEEKDAY_BARS: readonly BarSpec<number>[] = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
].map((label, weekday) => [weekday, label]);

/** As 24 horas do dia, como "09h", mesmo as que não tiveram atendimento. */
export const HOUR_BARS: readonly BarSpec<number>[] = Array.from({ length: 24 }, (_, hour) => [
  hour,
  `${String(hour).padStart(2, "0")}h`,
]);

/** O `is_auto_agen` do agendamento. */
export const ORIGIN_BARS: readonly BarSpec<number>[] = [
  [0, "Manual"],
  [1, "Automático"],
];

/** O `remarcacao_ativa` do pet. */
export const RESCHEDULE_BARS: readonly BarSpec<number>[] = [
  [1, "Com remarcação"],
  [0, "Sem remarcação"],
];

/** O `pacote_remarcacao` do pet: quantas visitas por mês. */
export const PACKAGE_BARS: readonly BarSpec<number>[] = [
  [PacoteRemarcacao.Quinzenal, "Quinzenal\n(2x/mês)"],
  [PacoteRemarcacao.Mensal, "Semanal\n(4x/mês)"],
];
