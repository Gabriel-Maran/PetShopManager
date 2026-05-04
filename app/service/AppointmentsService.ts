import { appointmentsRepository } from "../repository/AppointmentsRepository";

class AppointmentService {
  getAppointmentById(id: number) {
    return appointmentsRepository.getAppointmentByID(id);
  }

  getAppointmentByDate(date: string) {
    return appointmentsRepository.getAppointmentByDate(date);
  }

  createAppointment(
    pet_id: number,
    servico: string,
    data: number,
    hora: string,
    entregar_pet: number,
    observacao?: string
  ) {
    return appointmentsRepository.createAppointment(
      pet_id,
      servico,
      data,
      hora,
      entregar_pet,
      observacao
    );
  }

  updateAppointment(
    pet_id: number,
    servico: string,
    data: number,
    hora: string,
    entregar_pet: number,
    observacao?: string
  ) {
    return appointmentsRepository.createAppointment(
      pet_id,
      servico,
      data,
      hora,
      entregar_pet,
      observacao
    );
  }

  deleteAppointment(id: number) {
    return appointmentsRepository.deleteAppointmentByID(id);
  }
}

export const appointmentsService = new AppointmentService
