import { Appointment } from "../model/Appointment";
import { AppointmentsWithOwnerAndPet } from "../model/Appointment";
import { appointmentsService } from "../service/AppointmentsService";
import { type IsoDate, isIsoDate } from "../utils/datas";
import { isValidCents } from "../utils/dinheiro";
import { AppError } from "../errors/AppError";
import { MESSAGES } from "../globals/messages";

/**
 * Campos obrigatórios, a data no formato do banco e o valor em centavos. Cada falha tem a sua
 * mensagem.
 */
function validateAppointment(appointment: Appointment): void {
  if (!appointment.pet_id) {
    throw new AppError("VALIDATION", MESSAGES.appointment.petRequired);
  }
  if (!appointment.servico?.trim()) {
    throw new AppError("VALIDATION", MESSAGES.appointment.serviceRequired);
  }
  if (!isIsoDate(appointment.data)) {
    throw new AppError("VALIDATION", MESSAGES.date.invalid);
  }
  if (!appointment.hora) {
    throw new AppError("VALIDATION", MESSAGES.appointment.timeRequired);
  }
  if (!isValidCents(appointment.valor)) {
    throw new AppError("VALIDATION", MESSAGES.money.invalid);
  }
}

class AppointmentsController {
  async getAppointmentById(id: number): Promise<Appointment> {
    const appointment = await appointmentsService.getAppointmentById(id);
    if (!appointment) throw new AppError("NOT_FOUND", MESSAGES.appointment.notFound);
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
    if (!id) throw new AppError("NOT_FOUND", MESSAGES.appointment.notFound);
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
