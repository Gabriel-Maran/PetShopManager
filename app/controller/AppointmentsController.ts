import { Appointment } from "../model/Appointment";
import { AppointmentsWithOwnerAndPet } from "../model/Appointment";
import { appointmentsService } from "../service/AppointmentsService";
import type { IsoDate } from "../utils/datas";
import { AppError } from "../errors/AppError";
import { MESSAGES } from "../globals/messages";
import { appointmentSchema } from "../validation/appointmentSchema";
import { parseInput, parseRecordId } from "../validation/parseInput";
import { petController } from "./PetController";

class AppointmentsController {
  async getAppointmentById(id: number): Promise<Appointment> {
    const appointment = await appointmentsService.getAppointmentById(
      parseRecordId(id, MESSAGES.appointment.notFound),
    );
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

  async createAppointment(input: Appointment): Promise<void> {
    const appointment = parseInput(appointmentSchema, input);
    await petController.getPetById(appointment.pet_id); // o pet precisa existir
    await appointmentsService.createAppointment(appointment);
  }

  async updateAppointment(id: number, input: Appointment): Promise<void> {
    const appointment = parseInput(appointmentSchema, input);
    await this.getAppointmentById(id); // valida existência
    await petController.getPetById(appointment.pet_id); // o pet precisa existir
    await appointmentsService.updateAppointment(id, appointment);
  }

  // Método dedicado para concluir — dispara trg_ultima_visita e trg_remarcacao_automatica
  async concludeAppointment(id: number): Promise<void> {
    await this.getAppointmentById(id); // valida existência
    await appointmentsService.concludeAppointment(id);
  }

  async deleteAppointment(id: number): Promise<void> {
    await appointmentsService.deleteAppointment(parseRecordId(id, MESSAGES.appointment.notFound));
  }

  deleteFutureAutoAppointmentsByPetId(petId: number): Promise<void> {
    return appointmentsService.deleteFutureAutoAppointmentsByPetId(
      parseRecordId(petId, MESSAGES.pet.notFound),
    );
  }
}

export const appointmentController = new AppointmentsController();
