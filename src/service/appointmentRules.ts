// As regras de entrada do agendamento que dependem do banco, que o AppointmentsService aplica antes de
// gravar. Sem depender do Expo, para os testes rodarem no Node, que exige a extensão .ts nos imports.
import { AppError } from "../errors/AppError.ts";
import { MESSAGES } from "../globals/messages.ts";
import type { PaymentsMethod } from "../model/PaymentMethod";
import type { ServiceType } from "../model/ServiceType";
import type { AppointmentData } from "../validation/appointmentSchema";

/** As listas que o formulário do agendamento oferece. */
export interface AppointmentChoices {
  services: readonly ServiceType[];
  paymentMethods: readonly PaymentsMethod[];
}

/**
 * O serviço e a forma de pagamento escolhidos precisam estar nas listas ativas. Desde a versão 6 do
 * esquema, o banco grava o id achado pelo nome: sem esta conferência, um serviço fora da lista cairia
 * no erro genérico do NOT NULL, e uma forma de pagamento fora da lista viraria "não informada" sem
 * aviso. O texto vazio na forma de pagamento é "não informada" e passa.
 *
 * Ao editar, `current` é o que o agendamento tem gravado. O nome igual ao gravado passa mesmo fora da
 * lista ativa, porque a migração mantém oculto o nome que o histórico já usava, e editar a observação,
 * por exemplo, não deve exigir trocar o serviço. Na criação, ou ao trocar para outro nome, só item
 * ativo.
 */
export function assertAppointmentChoices(
  appointment: Pick<AppointmentData, "servico" | "tipo_pgto">,
  { services, paymentMethods }: AppointmentChoices,
  current?: Pick<AppointmentData, "servico" | "tipo_pgto">,
): void {
  const service = appointment.servico;
  if (service !== current?.servico && !services.some(({ servico }) => servico === service)) {
    throw new AppError("NOT_FOUND", MESSAGES.appointment.serviceNotFound);
  }
  const paymentMethod = appointment.tipo_pgto;
  if (
    paymentMethod &&
    paymentMethod !== current?.tipo_pgto &&
    !paymentMethods.some(({ tipo_pgto }) => tipo_pgto === paymentMethod)
  ) {
    throw new AppError("NOT_FOUND", MESSAGES.appointment.paymentMethodNotFound);
  }
}
