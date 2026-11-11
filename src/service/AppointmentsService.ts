import { getDatabase } from "../config/database";
import type { AppointmentData } from "../validation/appointmentSchema";
import { appointmentsRepository } from "../repository/AppointmentsRepository";
import type { IsoDate } from "../utils/datas";
import { PackageScheduleService } from "./PackageScheduleService";
import { assertAppointmentChoices } from "./appointmentRules";
import { paymentMethodService } from "./PaymentMethodService";
import { serviceTypeService } from "./ServiceTypeService";

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

  async createAppointment(appointment: AppointmentData) {
    await assertChoicesExist(appointment);
    return appointmentsRepository.createAppointment(appointment);
  }

  async updateAppointment(id: number, appointment: AppointmentData) {
    // O que está gravado vale mesmo fora da lista ativa (nome oculto pela migração).
    const current = await this.getAppointmentById(id);
    await assertChoicesExist(appointment, current ?? undefined);
    return packageSchedule.updateAppointment(id, appointment);
  }
}

// O banco grava o serviço e a forma de pagamento pelo id, achado pelo nome ativo que a tela escolheu.
async function assertChoicesExist(
  appointment: AppointmentData,
  current?: Pick<AppointmentData, "servico" | "tipo_pgto">,
): Promise<void> {
  const [services, paymentMethods] = await Promise.all([
    serviceTypeService.getAllServiceTypes(),
    paymentMethodService.getAllPaymentMethods(),
  ]);
  assertAppointmentChoices(appointment, { services, paymentMethods }, current);
}

export const appointmentsService = new AppointmentsService();
