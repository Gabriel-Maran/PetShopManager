import { getDatabase } from "../config/database";
import type { PackageFrequency } from "../config/petEnums";
import type { IsoDate } from "../utils/dates";
import type { GroupCount } from "../utils/reports/charts";
import {
  ACTIVE_PACKAGES_SQL,
  APPOINTMENTS_BY_MONTH_SQL,
  APPOINTMENTS_BY_ORIGIN_SQL,
  COMPLETED_BY_HOUR_SQL,
  COMPLETED_BY_WEEKDAY_SQL,
  ABSENT_PETS_SQL,
  PETS_BY_RESCHEDULE_SQL,
  PETS_IN_PACKAGE_SQL,
} from "./sql/reportsSql";

/** As colunas de sim ou não (`concluido`, `reschedule_active`) guardam 1 ou 0. */
const asFlag = (value: boolean) => (value ? 1 : 0);

/** Um pet ausente como o gráfico mostra: "Pet · Dono" e os dias sem visita. */
export interface AbsentPetRow {
  label: string;
  days_absent: number;
}

class ReportsRepository {
  private async countBy<K extends number | string>(
    sql: string,
    params: (number | string)[] = [],
  ): Promise<GroupCount<K>[]> {
    const db = await getDatabase();
    return db.getAllAsync<GroupCount<K>>(sql, params);
  }

  countCompletedByWeekday(): Promise<GroupCount<number>[]> {
    return this.countBy(COMPLETED_BY_WEEKDAY_SQL);
  }

  countCompletedByHour(): Promise<GroupCount<number>[]> {
    return this.countBy(COMPLETED_BY_HOUR_SQL);
  }

  countByOrigin(completed: boolean): Promise<GroupCount<number>[]> {
    return this.countBy(APPOINTMENTS_BY_ORIGIN_SQL, [asFlag(completed)]);
  }

  /** Contagem por mês ("AAAA-MM") entre as duas datas, com as pontas. */
  countByMonth(
    completed: boolean,
    from: IsoDate,
    to: IsoDate,
  ): Promise<GroupCount<string>[]> {
    return this.countBy(APPOINTMENTS_BY_MONTH_SQL, [asFlag(completed), from, to]);
  }

  countPetsByReschedule(): Promise<GroupCount<number>[]> {
    return this.countBy(PETS_BY_RESCHEDULE_SQL);
  }

  countActivePackages(): Promise<GroupCount<number>[]> {
    return this.countBy(ACTIVE_PACKAGES_SQL);
  }

  async listPetNamesInPackage(packageSize: PackageFrequency): Promise<string[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ name: string }>(PETS_IN_PACKAGE_SQL, [packageSize]);
    return rows.map((row) => row.name);
  }

  async findAbsentPets(
    today: IsoDate,
    rescheduleActive: boolean,
    limit: number,
  ): Promise<AbsentPetRow[]> {
    const db = await getDatabase();
    return db.getAllAsync<AbsentPetRow>(ABSENT_PETS_SQL, [
      today,
      asFlag(rescheduleActive),
      limit,
    ]);
  }
}

export const reportsRepository = new ReportsRepository();
