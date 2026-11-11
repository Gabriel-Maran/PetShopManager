import { getDatabase } from "../config/database";
import {
  FIND_APPOINTMENT_SQL,
  INSERT_APPOINTMENT_SQL,
  insertAppointmentParams,
  LIST_APPOINTMENTS_BETWEEN_SQL,
  LIST_APPOINTMENTS_OF_DAY_SQL,
} from "./sql/appointmentsSql";
import { Appointment } from "../model/Appointment";
import { AppointmentsWithOwnerAndPet } from "../model/Appointment";
import type { IsoDate } from "../utils/dates";

// Salvar um agendamento pode criar o próximo do pacote, então o UPDATE fica no
// PackageScheduleRepository, que roda na transação da remarcação.
class AppointmentRepository {
  async getAppointmentById(id: number): Promise<Appointment | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Appointment>(FIND_APPOINTMENT_SQL, [id]);
  }

  async getAppointmentsByDateWithOwnerAndPet(
    date: IsoDate,
  ): Promise<AppointmentsWithOwnerAndPet[]> {
    const db = await getDatabase();
    return db.getAllAsync<AppointmentsWithOwnerAndPet>(LIST_APPOINTMENTS_OF_DAY_SQL, [date]);
  }

  // Retorna agendamentos de um intervalo de datas (útil para tela de calendário)
  async getAppointmentsByDateRange(
    from: IsoDate,
    to: IsoDate,
  ): Promise<Appointment[]> {
    const db = await getDatabase();
    return db.getAllAsync<Appointment>(LIST_APPOINTMENTS_BETWEEN_SQL, [from, to]);
  }

  // Cria agendamento manual (is_auto = 0 por padrão)
  async createAppointment(appointment: Appointment): Promise<void> {
    const db = await getDatabase();
    // Sempre manual e pendente ao criar via repositório, qualquer que seja o que o formulário mandou.
    await db.runAsync(
      INSERT_APPOINTMENT_SQL,
      insertAppointmentParams({ ...appointment, completed: 0, is_auto: 0 }),
    );
  }
}

export const appointmentsRepository = new AppointmentRepository();
