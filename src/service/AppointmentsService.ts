import type { AppointmentData } from "../validation/appointmentSchema";
import { appointmentsRepository } from "../repository/AppointmentsRepository";
import type { IsoDate } from "../utils/datas";

class AppointmentsService {
  getAppointmentById(id: number) {
    return appointmentsRepository.getAppointmentById(id);
  }

  getAppointmentsByDateWithOwnerAndPet(date: IsoDate) {
    return appointmentsRepository.getAppointmentsByDateWithOwnerAndPet(date);
  }

  getAppointmentsByDateRange(from: IsoDate, to: IsoDate) {
    return appointmentsRepository.getAppointmentsByDateRange(from, to);
  }

  createAppointment(appointment: AppointmentData) {
    return appointmentsRepository.createAppointment(appointment);
  }

  updateAppointment(id: number, appointment: AppointmentData) {
    return appointmentsRepository.updateAppointment(id, appointment);
  }
}

export const appointmentsService = new AppointmentsService();
