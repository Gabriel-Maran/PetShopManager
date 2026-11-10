import { getDatabase } from "../config/database";
import {
  FIND_APPOINTMENT_SQL,
  INSERT_APPOINTMENT_SQL,
  LIST_APPOINTMENTS_BETWEEN_SQL,
  LIST_APPOINTMENTS_OF_DAY_SQL,
} from "./sql/appointmentsSql";
import { Appointment } from "../model/Appointment";
import { AppointmentsWithOwnerAndPet } from "../model/Appointment";
import type { IsoDate } from "../utils/datas";

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

  // Cria agendamento manual (is_auto_agen = 0 por padrão)
  async createAppointment(appointment: Appointment): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      INSERT_APPOINTMENT_SQL,
      [
        appointment.pet_id,
        appointment.servico,
        appointment.data,
        appointment.hora,
        appointment.entregar_pet,
        0,
        appointment.observacao ?? null,
        0, // sempre manual ao criar via repositório
        appointment.valor,
        appointment.tipo_pgto,
        appointment.ta_pago,
      ],
    );
  }
}

export const appointmentsRepository = new AppointmentRepository();
