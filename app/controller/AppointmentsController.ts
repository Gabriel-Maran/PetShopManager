import { Appointment } from "../model/Appointment";
import { appointmentsService } from "../service/AppointmentsService";

class AppointmentsController {
  getAppointmentsByID(id: number) {
    return appointmentsService.getAppointmentById(id);
  }

  getAppointmentsByDate(date: number) {
    return appointmentsService.getAppointmentByDate(date);
  }

  async createAppointment(
    pet_id: number,
    servico: string,
    data: number,
    entregar_pet: number,
    observacao?: string,
  ): Promise<void> {
    if (
      !pet_id ||
      !servico ||
      !data ||
      !entregar_pet ||
      servico.trim() === ""
    ) {
      throw new Error("Dados faltando.");
    }
    let appointment: Appointment = {
      pet_id: pet_id,
      servico: servico,
      data: data,
      entregar_pet: entregar_pet,
      observacao: observacao,
      concluido: 0,
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
    observacao?: string,
  ): Promise<void> {
    if (
      !id ||
      !pet_id ||
      !servico ||
      !data ||
      !entregar_pet ||
      servico.trim() === ""
    ) {
      throw new Error("Dados faltando.");
    }

    let appointment: Appointment = {
      pet_id: pet_id,
      servico: servico,
      data: data,
      entregar_pet: entregar_pet,
      observacao: observacao,
      concluido: concluido,
    };
    await appointmentsService.updateAppointment(id, appointment);
  }

  async deleteAppointment(id: number): Promise<void> {
    return appointmentsService.deleteAppointment(id);
  }
}

export const appointmentController = new AppointmentsController();
