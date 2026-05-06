import { Appointment } from "../model/Appointment";
import { appointmentsRepository } from "../repository/AppointmentsRepository";

class AppointmentsService {
  getAppointmentById(id: number) {
    return appointmentsRepository.getAppointmentById(id);
  }

  getAppointmentsByDate(date: number) {
    return appointmentsRepository.getAppointmentsByDate(date);
  }

  getAppointmentsByDateRange(from: number, to: number) {
    return appointmentsRepository.getAppointmentsByDateRange(from, to);
  }

  getAppointmentsByPetId(petId: number) {
    return appointmentsRepository.getAppointmentsByPetId(petId);
  }

  getPendingAppointmentsByPetId(petId: number) {
    return appointmentsRepository.getPendingAppointmentsByPetId(petId);
  }

  createAppointment(appointment: Appointment) {
    return appointmentsRepository.createAppointment(appointment);
  }

  updateAppointment(id: number, appointment: Appointment) {
    return appointmentsRepository.updateAppointment(id, appointment);
  }

  concludeAppointment(id: number) {
    return appointmentsRepository.concludeAppointment(id);
  }

  deleteAppointment(id: number) {
    return appointmentsRepository.deleteAppointmentById(id);
  }

  deleteFutureAutoAppointmentsByPetId(petId: number) {
    return appointmentsRepository.deleteFutureAutoAppointmentsByPetId(petId);
  }
}

export const appointmentsService = new AppointmentsService();
