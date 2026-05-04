import { Appointment } from "../model/Appointment";
import { appointmentsRepository } from "../repository/AppointmentsRepository";

class AppointmentService {
  getAppointmentById(id: number) {
    return appointmentsRepository.getAppointmentByID(id);
  }

  getAppointmentByDate(date: number) {
    return appointmentsRepository.getAppointmentByDate(date);
  }

  createAppointment(appointment: Appointment) {
    return appointmentsRepository.createAppointment(appointment);
  }

  updateAppointment(id: number, appointment: Appointment) {
    return appointmentsRepository.updateAppointment(id, appointment);
  }

  deleteAppointment(id: number) {
    return appointmentsRepository.deleteAppointmentByID(id);
  }
}

export const appointmentsService = new AppointmentService();
