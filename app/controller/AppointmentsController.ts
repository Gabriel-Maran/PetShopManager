import { Appointment } from "../model/Appointment";
import { AppointmentsWithOwnerAndPet } from "../model/Appointment";
import { appointmentsService } from "../service/AppointmentsService";
import { INVALID_DATE_MESSAGE, type IsoDate, isIsoDate } from "../utils/datas";
import { INVALID_MONEY_MESSAGE, isValidCents } from "../utils/dinheiro";

/** Campos obrigatórios, a data no formato do banco e o valor em centavos. */
function validateAppointment(appointment: Appointment): void {
  if (
    !appointment.pet_id ||
    !appointment.servico?.trim() ||
    !appointment.data ||
    !appointment.hora
  ) {
    throw new Error("Dados faltando.");
  }
  if (!isIsoDate(appointment.data)) throw new Error(INVALID_DATE_MESSAGE);
  if (!isValidCents(appointment.valor)) throw new Error(INVALID_MONEY_MESSAGE);
}

class AppointmentsController {
  async getAppointmentById(id: number): Promise<Appointment> {
    const appointment = await appointmentsService.getAppointmentById(id);
    if (!appointment) throw new Error("Agendamento não encontrado.");
    return appointment;
  }

  getAppointmentsByDate(date: IsoDate): Promise<Appointment[]> {
    return appointmentsService.getAppointmentsByDate(date);
  }

  getAppointmentsByDateWithOwnerAndPet(
    date: IsoDate,
  ): Promise<AppointmentsWithOwnerAndPet[]> {
    return appointmentsService.getAppointmentsByDateWithOwnerAndPet(date);
  }

  getAppointmentsByDateRange(from: IsoDate, to: IsoDate): Promise<Appointment[]> {
    return appointmentsService.getAppointmentsByDateRange(from, to);
  }

  getAppointmentsByDateRangeNotDone(from: IsoDate, to: IsoDate): Promise<Appointment[]> {
    return appointmentsService.getAppointmentsByDateRangeNotDone(from, to);
  }

  getAppointmentsByPetId(petId: number): Promise<Appointment[]> {
    return appointmentsService.getAppointmentsByPetId(petId);
  }

  getPendingAppointmentsByPetId(petId: number): Promise<Appointment[]> {
    return appointmentsService.getPendingAppointmentsByPetId(petId);
  }

  async createAppointment(appointment: Appointment): Promise<void> {
    validateAppointment(appointment);
    await appointmentsService.createAppointment(appointment);
  }

  async updateAppointment(id: number, appointment: Appointment): Promise<void> {
    if (!id) throw new Error("Dados faltando.");
    validateAppointment(appointment);
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
