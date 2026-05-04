import { appointmentsService } from "../service/AppointmentsService";

class AppointmentsController {
  getAppointmentsByID(id: number) {
    return appointmentsService.getAppointmentById(id);
  }
  getAppointmentsByDate(date: string) {
    return appointmentsService.getAppointmentByDate(date);
  }
  async createAppointment(
    pet_id: number,
    servico: string,
    data: number,
    hora: string,
    entregar_pet: number,
    observacao?: string,
  ): Promise<void> {
    if (
      !pet_id ||
      !servico ||
      !data ||
      !hora ||
      !entregar_pet ||
      servico.trim() === "" ||
      hora.trim() === ""
    ) {
      throw new Error("Dados faltando.");
    }
    await appointmentsService.createAppointment(
      pet_id,
      servico,
      data,
      hora,
      entregar_pet,
      observacao,
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
    if (
      !pet_id ||
      !servico ||
      !data ||
      !hora ||
      !entregar_pet ||
      servico.trim() === "" ||
      hora.trim() === ""
    ) {
      throw new Error("Dados faltando.");
    }
    await appointmentsService.updateAppointment(
      pet_id,
      servico,
      data,
      hora,
      entregar_pet,
      observacao,
    );
  }
  async deleteAppointment(id: number): Promise<void> {
    return appointmentsService.deleteAppointment(id);
  }
}

export const appointmentController = new AppointmentsController();
