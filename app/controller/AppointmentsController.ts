import { Appointment } from "../model/Appointment";
import { appointmentsService } from "../service/AppointmentsService";

class AppointmentsController {
  async getAppointmentById(id: number): Promise<Appointment> {
    const appointment = await appointmentsService.getAppointmentById(id);
    if (!appointment) throw new Error("Agendamento não encontrado.");
    return appointment;
  }

  getAppointmentsByDate(date: number): Promise<Appointment[]> {
    return appointmentsService.getAppointmentsByDate(date);
  }

  getAppointmentsByDateRange(from: number, to: number): Promise<Appointment[]> {
    return appointmentsService.getAppointmentsByDateRange(from, to);
  }

  getAppointmentsByPetId(petId: number): Promise<Appointment[]> {
    return appointmentsService.getAppointmentsByPetId(petId);
  }

  getPendingAppointmentsByPetId(petId: number): Promise<Appointment[]> {
    return appointmentsService.getPendingAppointmentsByPetId(petId);
  }

  async createAppointment(
    pet_id: number,
    servico: string,
    data: number,
    entregar_pet: number,
    observacao?: string | null,
    horaParam?: string | null,
  ): Promise<void> {
    if (!pet_id || !servico || !data || servico.trim() === "") {
      throw new Error("Dados faltando.");
    }

    const hora = horaParam ?? "00:00";

    const appointment: Appointment = {
      pet_id,
      servico,
      data,
      hora,
      entregar_pet,
      observacao: observacao ?? null,
      concluido: 0,
      is_auto_agen: 0,
    };

    await appointmentsService.createAppointment(appointment);
  }

  async updateAppointment(
    id: number,
    pet_id: number,
    servico: string,
    concluido: number,
    data: number,
    entregar_pet: number,
    observacao?: string | null,
    horaParam?: string | null,
  ): Promise<void> {
    if (!id || !pet_id || !servico || !data || servico.trim() === "") {
      throw new Error("Dados faltando.");
    }

    const hora = horaParam ?? "00:00";

    const appointment: Appointment = {
      pet_id,
      servico,
      data,
      hora,
      entregar_pet,
      observacao: observacao ?? null,
      concluido,
      is_auto_agen: 0,
    };

    await appointmentsService.updateAppointment(id, appointment);
  }

  // Método dedicado para concluir — dispara trg_ultima_visita e trg_remarcacao_automatica
  async concludeAppointment(id: number): Promise<void> {
    await this.getAppointmentById(id); // valida existência
    await appointmentsService.concludeAppointment(id);
  }

  async deleteAppointment(id: number): Promise<void> {
    await appointmentsService.deleteAppointment(id);
  }

  deleteFutureAutoAppointmentsByPetId(petId: number): Promise<void> {
    return appointmentsService.deleteFutureAutoAppointmentsByPetId(petId);
  }
}

export const appointmentController = new AppointmentsController();
