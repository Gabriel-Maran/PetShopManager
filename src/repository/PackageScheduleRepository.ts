// Os comandos que a remarcação automática grava e consulta, sem depender do Expo: recebe a conexão
// pronta, para o app (com o expo-sqlite) e os testes (com o node:sqlite) rodarem o mesmo código. Os
// imports levam a extensão .ts porque o Node dos testes exige.
import type { MigrationDatabase } from "../config/migrator.ts";
import type { Pet } from "../model/Pet.ts";
import type { Appointment } from "../model/Appointment.ts";
import type { PetPackage } from "../domain/packageSchedule.ts";
import type { IsoDate } from "../utils/datas.ts";
import type { Cents } from "../utils/dinheiro.ts";
import { normalizeForSearch } from "../utils/formatadores/normalizaNome.ts";
import {
  ACTIVATE_PET_SQL,
  FIND_PET_PACKAGE_SQL,
  INSERT_PET_SQL,
  REFRESH_LAST_AUTO_VISIT_SQL,
  UPDATE_PET_SQL,
} from "./sql/petsSql.ts";
import {
  COUNT_AUTO_IN_MONTH_SQL,
  COUNT_PENDING_AUTO_IN_MONTH_SQL,
  DELETE_PENDING_AUTO_FROM_SQL,
  FIND_APPOINTMENT_STATE_SQL,
  INSERT_PACKAGE_VISIT_SQL,
  LIST_CONCLUDED_DATES_FROM_SQL,
  UPDATE_APPOINTMENT_SQL,
} from "./sql/appointmentsSql.ts";

type SqlValue = string | number | null;

/** A parte da conexão do expo-sqlite que a remarcação usa, com a transação das migrações. */
export interface ScheduleDatabase extends MigrationDatabase {
  runAsync(sql: string, ...params: SqlValue[]): Promise<{ lastInsertRowId: number }>;
  getFirstAsync<T>(sql: string, ...params: SqlValue[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: SqlValue[]): Promise<T[]>;
}

/** O que a conclusão de um agendamento olha antes e depois de salvar, com o serviço pelo id. */
export type AppointmentState = Pick<
  Appointment,
  "pet_id" | "data" | "entregar_pet" | "concluido" | "observacao" | "is_auto_agen"
> & { servico_id: number };

/** Um atendimento da agenda do pacote, pronto para gravar. */
export interface PackageVisitRow {
  petId: number;
  serviceId: number;
  date: IsoDate;
  time: string | null | undefined;
  deliverPet: number;
  notes: string | null | undefined;
  auto: boolean;
  cents: Cents;
}

/** O pet como o formulário grava: as colunas do INSERT_PET_SQL e do UPDATE_PET_SQL. */
export type PetWrite = Pick<
  Pet,
  | "nome"
  | "especie"
  | "porte"
  | "raca"
  | "observacoes"
  | "dono_id"
  | "servico_padrao"
  | "remarcacao_ativa"
  | "pacote_remarcacao"
  | "data_inicio_pacote"
  | "horario_padrao"
  | "valor_pacote"
>;

// Os parâmetros na ordem do INSERT_PET_SQL e do UPDATE_PET_SQL.
const petParams = (pet: PetWrite): SqlValue[] => [
  pet.nome,
  normalizeForSearch(pet.nome),
  pet.especie,
  pet.porte,
  pet.raca ?? null,
  pet.observacoes ?? null,
  pet.dono_id,
  pet.servico_padrao ?? "Banho",
  pet.remarcacao_ativa ?? 0,
  pet.pacote_remarcacao ?? null,
  pet.data_inicio_pacote ?? null,
  pet.horario_padrao ?? null,
  pet.valor_pacote ?? null,
];

export class PackageScheduleRepository {
  // Campo declarado à parte, e não no construtor, porque o Node dos testes só apaga os tipos.
  private readonly db: ScheduleDatabase;

  constructor(db: ScheduleDatabase) {
    this.db = db;
  }

  /** Cadastra o pet e devolve o id dele. */
  async insertPet(pet: PetWrite): Promise<number> {
    const { lastInsertRowId } = await this.db.runAsync(INSERT_PET_SQL, ...petParams(pet));
    return lastInsertRowId;
  }

  async updatePet(id: number, pet: PetWrite): Promise<void> {
    await this.db.runAsync(UPDATE_PET_SQL, ...petParams(pet), id);
  }

  async activatePet(id: number): Promise<void> {
    await this.db.runAsync(ACTIVATE_PET_SQL, id);
  }

  findPetPackage(id: number): Promise<PetPackage | null> {
    return this.db.getFirstAsync<PetPackage>(FIND_PET_PACKAGE_SQL, id);
  }

  async updateAppointment(id: number, appointment: Appointment): Promise<void> {
    await this.db.runAsync(
      UPDATE_APPOINTMENT_SQL,
      appointment.pet_id,
      appointment.servico,
      appointment.data,
      appointment.hora,
      appointment.entregar_pet,
      appointment.concluido,
      appointment.observacao ?? null,
      appointment.valor,
      appointment.tipo_pgto,
      appointment.ta_pago,
      id,
    );
  }

  findAppointmentState(id: number): Promise<AppointmentState | null> {
    return this.db.getFirstAsync<AppointmentState>(FIND_APPOINTMENT_STATE_SQL, id);
  }

  async insertVisits(visits: readonly PackageVisitRow[]): Promise<void> {
    for (const visit of visits) {
      await this.db.runAsync(
        INSERT_PACKAGE_VISIT_SQL,
        visit.petId,
        visit.serviceId,
        visit.date,
        visit.time ?? null,
        visit.deliverPet,
        visit.notes ?? null,
        visit.auto ? 1 : 0,
        visit.cents,
      );
    }
  }

  async deletePendingAutoFrom(petId: number, from: IsoDate): Promise<void> {
    await this.db.runAsync(DELETE_PENDING_AUTO_FROM_SQL, petId, from);
  }

  async concludedDatesFrom(petId: number, from: IsoDate): Promise<Set<IsoDate>> {
    const rows = await this.db.getAllAsync<{ data: IsoDate }>(LIST_CONCLUDED_DATES_FROM_SQL, petId, from);
    return new Set(rows.map(({ data }) => data));
  }

  /** Automáticos pendentes do pet no mês ("AAAA-MM"). */
  countPendingAutoInMonth(petId: number, month: string): Promise<number> {
    return this.count(COUNT_PENDING_AUTO_IN_MONTH_SQL, petId, month);
  }

  /** Automáticos do pet no mês ("AAAA-MM"), concluídos ou não. */
  countAutoInMonth(petId: number, month: string): Promise<number> {
    return this.count(COUNT_AUTO_IN_MONTH_SQL, petId, month);
  }

  private async count(sql: string, ...params: SqlValue[]): Promise<number> {
    const row = await this.db.getFirstAsync<{ total: number }>(sql, ...params);
    return row?.total ?? 0;
  }

  async refreshLastAutoVisit(petId: number): Promise<void> {
    await this.db.runAsync(REFRESH_LAST_AUTO_VISIT_SQL, petId, petId);
  }
}
