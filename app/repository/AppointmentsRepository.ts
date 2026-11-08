import { getDatabase } from "../config/database";
import { CONCLUDE_APPOINTMENT_SQL, INSERT_APPOINTMENT_SQL, UPDATE_APPOINTMENT_SQL } from "./sql/appointmentsSql";
import { Appointment } from "../model/Appointment";
import { AppointmentsWithOwnerAndPet } from "../model/Appointment";

class AppointmentRepository {
  async getAppointmentById(id: number): Promise<Appointment | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Appointment>(
      `SELECT * FROM appointments WHERE id = ?`,
      [id],
    );
  }

  // Retorna todos os agendamentos de uma data específica (formato YYYYMMDD)
  async getAppointmentsByDate(date: number): Promise<Appointment[]> {
    const db = await getDatabase();
    return db.getAllAsync<Appointment>(
      `SELECT 
        * 
       FROM appointments 
       WHERE data = ? 
       ORDER BY ORDER BY AP.concluido, AP.hora ASC`,
      [date],
    );
  }

  async getAppointmentsByDateWithOwnerAndPet(
    date: number,
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
    from: number,
    to: number,
  ): Promise<Appointment[]> {
    const db = await getDatabase();
    return db.getAllAsync<Appointment>(
      `SELECT * FROM appointments WHERE data BETWEEN ? AND ? ORDER BY data ASC`,
      [from, to],
    );
  }

  // Retorna agendamentos de um intervalo de datas que não estão concluídos
  async getAppointmentsByDateRangeNotDone(
    from: number,
    to: number,
  ): Promise<Appointment[]> {
    const db = await getDatabase();
    return db.getAllAsync<Appointment>(
      `SELECT 
        * 
       FROM 
       appointments 
       WHERE data BETWEEN ? AND ? 
       AND concluido <> 1
       ORDER BY data ASC`,
      [from, to],
    );
  }

  // Retorna todos os agendamentos de um pet (histórico)
  async getAppointmentsByPetId(petId: number): Promise<Appointment[]> {
    const db = await getDatabase();
    return db.getAllAsync<Appointment>(
      `SELECT * FROM appointments WHERE pet_id = ? ORDER BY data DESC`,
      [petId],
    );
  }

  // Retorna agendamentos futuros não concluídos de um pet
  async getPendingAppointmentsByPetId(petId: number): Promise<Appointment[]> {
    const db = await getDatabase();
    return db.getAllAsync<Appointment>(
      `SELECT * FROM appointments
       WHERE pet_id = ?
         AND concluido = 0
         AND data >= CAST(strftime('%Y%m%d', 'now') AS INTEGER)
       ORDER BY data ASC`,
      [petId],
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

  // Conclui um agendamento — dispara trg_ultima_visita e trg_remarcacao_automatica
  async concludeAppointment(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(CONCLUDE_APPOINTMENT_SQL, [
      id,
    ]);
  }

  async deleteAppointmentById(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM appointments WHERE id = ?`, [id]);
  }

  // Remove todos os agendamentos automáticos futuros de um pet
  // (alternativa manual ao trigger de desativação)
  async deleteFutureAutoAppointmentsByPetId(petId: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM appointments
       WHERE pet_id = ?
         AND is_auto_agen = 1
         AND concluido = 0
         AND data > CAST(strftime('%Y%m%d', 'now') AS INTEGER)`,
      [petId],
    );
  }
}

export const appointmentsRepository = new AppointmentRepository();
