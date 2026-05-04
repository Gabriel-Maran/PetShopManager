import { getDatabase } from "../config/database";
import { Appointment } from "../model/Appointment";
import { Pet } from "../model/Pet";

class AppointmentRepository {
  async getAppointmentByID(id: number): Promise<Appointment | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Appointment>(
      `SELECT * FROM appointments where id = ?`,
      [id],
    );
  }

  async getAppointmentByDate(date: number): Promise<Appointment | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Appointment>(
      `SELECT * FROM appointments where data = ?`,
      [date],
    );
  }

  async createAppointment(appointment: Appointment): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
      `INSERT INTO appointments
      (pet_id, servico, data, entregar_pet, concluido, observacao)
     VALUES
      (?, ?, ?, ?, ?, ?)`,
      [
        appointment.pet_id,
        appointment.servico,
        appointment.data,
        appointment.entregar_pet,
        0,
        appointment.observacao ?? null,
      ],
    );
  }

  async updateAppointment(id: number, appointment: Appointment): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
      `UPDATE appointments SET
      pet_id = ?,
      servico = ?,
      data = ?,
      entregar_pet = ?,
      concluido = ?,
      observacao = ?
     WHERE id = ?`,
      [
        appointment.pet_id,
        appointment.servico,
        appointment.data,
        appointment.entregar_pet,
        appointment.concluido,
        appointment.observacao ?? null,
        id,
      ],
    );
  }

  async deleteAppointmentByID(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM appointments WHERE id = ?`, [id]);
  }
}

export const appointmentsRepository = new AppointmentRepository();
