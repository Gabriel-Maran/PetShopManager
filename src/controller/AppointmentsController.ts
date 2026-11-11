import { Appointment } from "../model/Appointment";
import { AppointmentsWithOwnerAndPet } from "../model/Appointment";
import { appointmentsService } from "../service/AppointmentsService";
import type { IsoDate } from "../utils/dates";
import { AppError } from "../errors/AppError";
import { MESSAGES } from "../globals/messages";
import { appointmentSchema, appointmentSchemaFor } from "../validation/appointmentSchema";
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

  getAppointmentsByDateWithOwnerAndPet(
    date: IsoDate,
  ): Promise<AppointmentsWithOwnerAndPet[]> {
    return appointmentsService.getAppointmentsByDateWithOwnerAndPet(date);
  }

  getAppointmentsByDateRange(from: IsoDate, to: IsoDate): Promise<Appointment[]> {
    return appointmentsService.getAppointmentsByDateRange(from, to);
  }

  async createAppointment(input: Appointment): Promise<void> {
    const appointment = parseInput(appointmentSchema, input);
    await petController.getPetById(appointment.pet_id); // o pet precisa existir
    await appointmentsService.createAppointment(appointment);
  }

  async updateAppointment(id: number, input: Appointment): Promise<void> {
    // O gravado vem antes da validação: os limites de texto valem só para o que mudou.
    const stored = await this.getAppointmentById(id); // valida existência
    const appointment = parseInput(appointmentSchemaFor(stored), input);
    await petController.getPetById(appointment.pet_id); // o pet precisa existir
    await appointmentsService.updateAppointment(id, appointment);
  }
}

export const appointmentController = new AppointmentsController();
