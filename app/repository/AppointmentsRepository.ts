import { getDatabase } from "../config/database";
import { Appointment } from "../model/Appointment";

class AppointmentRepository {
  async getAppointmentByID(id: number): Promise<Appointment | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Appointment>(
      `SELECT * FROM appointments where id = ?`,
      [id],
    );
  }

  async getAppointmentByDate(date: string): Promise<Appointment | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Appointment>(
      `SELECT * FROM appointments where data = ?`,
      [date]
    );
  }

  async createAppointment(
    pet_id: number,
    servico: string,
    data: number,
    hora: string,
    entregar_pet: number,
    observacao?: string
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO appointments (pet_id, servico, data, hora, entregar_pet, observacao)
        values (?,?,?,?,?,?)`,
      [
        pet_id,
        servico,
        data,
        hora,
        entregar_pet,
        observacao ?? null,
      ],
    );
  }

  async updateAppointment(
    pet_id: number,
    servico: string,
    data: number,
    hora: string,
    entregar_pet: number,
    observacao?: string,
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE appointments SET pet_id = ?, servico = ?, data = ?, hora = ?, entregar_pet = ?, observacao = ?`,
      [pet_id, servico, data, hora, entregar_pet, observacao ?? null],
    );
  }

  async deleteAppointmentByID(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM appointments WHERE id = ?`, [id]);
  }
}

export const appointmentsRepository = new AppointmentRepository();
