import { Appointment } from "../model/Appointment";
import { AppointmentsWithOwnerAndPet } from "../model/Appointment";
import { appointmentsService } from "../service/AppointmentsService";
import { centsToMoney, INVALID_MONEY_MESSAGE, normalizeMoney } from "../utils/dinheiro";

/**
 * O valor vai para o banco sempre no mesmo formato ("80,00"). Sem valor, fica 0,00, como o padrão
 * da tabela.
 */
function appointmentValue(text: string | null | undefined): string {
  if (!text?.trim()) return centsToMoney(0);
  const normalized = normalizeMoney(text);
  if (normalized === null) throw new Error(INVALID_MONEY_MESSAGE);
  return normalized;
}

class AppointmentsController {
  async getAppointmentById(id: number): Promise<Appointment> {
    const appointment = await appointmentsService.getAppointmentById(id);
    if (!appointment) throw new Error("Agendamento não encontrado.");
    return appointment;
  }

  getAppointmentsByDate(date: number): Promise<Appointment[]> {
    return appointmentsService.getAppointmentsByDate(date);
  }

  getAppointmentsByDateWithOwnerAndPet(
    date: number,
  ): Promise<AppointmentsWithOwnerAndPet[]> {
    return appointmentsService.getAppointmentsByDateWithOwnerAndPet(date);
  }

  getAppointmentsByDateRange(from: number, to: number): Promise<Appointment[]> {
    return appointmentsService.getAppointmentsByDateRange(from, to);
  }

  getAppointmentsByDateRangeNotDone(from: number, to: number): Promise<Appointment[]> {
    return appointmentsService.getAppointmentsByDateRangeNotDone(from, to);
  }

  getAppointmentsByPetId(petId: number): Promise<Appointment[]> {
    return appointmentsService.getAppointmentsByPetId(petId);
  }

  getPendingAppointmentsByPetId(petId: number): Promise<Appointment[]> {
    return appointmentsService.getPendingAppointmentsByPetId(petId);
  }

  async createAppointment(appointment: Appointment): Promise<void> {
    if (
      !appointment.pet_id ||
      !appointment.servico ||
      !appointment.data ||
      !appointment.hora ||
      appointment.servico.trim() === ""
    ) {
      throw new Error("Dados faltando.");
    }
    await appointmentsService.createAppointment({
      ...appointment,
      valor: appointmentValue(appointment.valor),
    });
  }

  async updateAppointment(id: number, appointment: Appointment): Promise<void> {
    if (
      !id ||
      !appointment.pet_id ||
      !appointment.servico ||
      !appointment.data ||
      !appointment.hora ||
      appointment.servico.trim() === ""
    ) {
      throw new Error("Dados faltando.");
    }

    await appointmentsService.updateAppointment(id, {
      ...appointment,
      valor: appointmentValue(appointment.valor),
    });
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
