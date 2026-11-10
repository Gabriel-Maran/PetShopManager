import { getDatabase } from "../config/database";
import type { AppointmentData } from "../validation/appointmentSchema";
import { appointmentsRepository } from "../repository/AppointmentsRepository";
import type { IsoDate } from "../utils/datas";
import { PackageScheduleService } from "./PackageScheduleService";

// Concluir um automático cria o próximo da agenda do pacote, na mesma transação.
const packageSchedule = new PackageScheduleService(getDatabase);

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
    return packageSchedule.updateAppointment(id, appointment);
  }
}

export const appointmentsService = new AppointmentsService();
