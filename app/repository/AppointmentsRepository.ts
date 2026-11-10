import { getDatabase } from "../config/database";
import { INSERT_APPOINTMENT_SQL, UPDATE_APPOINTMENT_SQL } from "./sql/appointmentsSql";
import { Appointment } from "../model/Appointment";
import { AppointmentsWithOwnerAndPet } from "../model/Appointment";
import type { IsoDate } from "../utils/datas";

class AppointmentRepository {
  async getAppointmentById(id: number): Promise<Appointment | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Appointment>(
      `SELECT * FROM appointments WHERE id = ?`,
      [id],
    );
  }

  async getAppointmentsByDateWithOwnerAndPet(
    date: IsoDate,
  ): Promise<AppointmentsWithOwnerAndPet[]> {
    const db = await getDatabase();
    return db.getAllAsync<AppointmentsWithOwnerAndPet>(
      `
    SELECT 
      AP.*,
      PT.nome    AS nome_pet,
      SP.nome    AS especie,
      OW.nome    AS nome_dono
    FROM appointments AS AP
    JOIN pets    AS PT ON AP.pet_id = PT.id
    JOIN owners  AS OW ON PT.dono_id = OW.id
    JOIN species AS SP ON PT.especie = SP.id
    WHERE AP.data = ?
    ORDER BY AP.concluido, AP.hora ASC
    `,
      [date],
    );
  }

  // Retorna agendamentos de um intervalo de datas (útil para tela de calendário)
  async getAppointmentsByDateRange(
    from: IsoDate,
    to: IsoDate,
  ): Promise<Appointment[]> {
    const db = await getDatabase();
    return db.getAllAsync<Appointment>(
      `SELECT * FROM appointments WHERE data BETWEEN ? AND ? ORDER BY data ASC`,
      [from, to],
    );
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

  async updateAppointment(id: number, appointment: Appointment): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      UPDATE_APPOINTMENT_SQL,
      [
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
      ],
    );
  }
}

export const appointmentsRepository = new AppointmentRepository();
