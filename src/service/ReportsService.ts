import type { PackageFrequency } from "../config/petEnums";
import { reportsRepository } from "../repository/ReportsRepository";
import { todayIso } from "../utils/dates";
import {
  type BarChartItem,
  countsToBars,
  HOUR_BARS,
  ORIGIN_BARS,
  PACKAGE_BARS,
  RESCHEDULE_BARS,
  WEEKDAY_BARS,
} from "../utils/reports/charts";
import {
  lastMonthsRange,
  type MonthRange,
  nextMonthsRange,
} from "../utils/reports/months";

/** Quantos pets cada gráfico de pets ausentes mostra. */
const ABSENT_PETS_LIMIT = 30;

/** Quantos meses cada gráfico do comparativo mensal mostra. */
const MONTHLY_COMPARISON_MONTHS = 12;

/** Os dados dos relatórios, já como as barras dos gráficos. */
class ReportsService {
  async getCompletedByWeekday(): Promise<BarChartItem[]> {
    return countsToBars(await reportsRepository.countCompletedByWeekday(), WEEKDAY_BARS);
  }

  async getCompletedByHour(): Promise<BarChartItem[]> {
    return countsToBars(await reportsRepository.countCompletedByHour(), HOUR_BARS);
  }

  /** Agendamentos manuais e automáticos, concluídos ou pendentes. */
  async getAppointmentsByOrigin(completed: boolean): Promise<BarChartItem[]> {
    return countsToBars(await reportsRepository.countByOrigin(completed), ORIGIN_BARS);
  }

  /** Atendimentos concluídos em cada um dos últimos meses, contando o atual. */
  getCompletedByMonth(): Promise<BarChartItem[]> {
    return this.countByMonth(true, lastMonthsRange(new Date(), MONTHLY_COMPARISON_MONTHS));
  }

  /** Atendimentos pendentes de hoje até o fim dos próximos meses, contando o atual. */
  getScheduledByMonth(): Promise<BarChartItem[]> {
    return this.countByMonth(false, nextMonthsRange(new Date(), MONTHLY_COMPARISON_MONTHS));
  }

  /** Os pets ativos há mais tempo sem visita, com a remarcação ligada ou desligada. */
  async getAbsentPets(rescheduleActive: boolean): Promise<BarChartItem[]> {
    const rows = await reportsRepository.findAbsentPets(
      todayIso(),
      rescheduleActive,
      ABSENT_PETS_LIMIT,
    );
    return rows.map((row) => ({ x: row.label, y: row.days_absent }));
  }

  async getPetsByReschedule(): Promise<BarChartItem[]> {
    return countsToBars(await reportsRepository.countPetsByReschedule(), RESCHEDULE_BARS);
  }

  async getActivePackages(): Promise<BarChartItem[]> {
    return countsToBars(await reportsRepository.countActivePackages(), PACKAGE_BARS);
  }

  /** Uma barra por pet do pacote, com a altura nas visitas por mês. */
  async getPetsInPackage(packageSize: PackageFrequency): Promise<BarChartItem[]> {
    const names = await reportsRepository.listPetNamesInPackage(packageSize);
    return names.map((name) => ({ x: name, y: packageSize }));
  }

  private async countByMonth(
    completed: boolean,
    { from, to, bars }: MonthRange,
  ): Promise<BarChartItem[]> {
    return countsToBars(await reportsRepository.countByMonth(completed, from, to), bars);
  }
}

export const reportsService = new ReportsService();
