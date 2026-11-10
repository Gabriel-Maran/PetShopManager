// O agendamento (VALID-1). Sem depender do Expo, para os testes rodarem no Node, que exige a extensão
// .ts nos imports.
import * as z from "zod";
import { MESSAGES } from "../globals/messages.ts";
import { MAX_LIST_ITEM_LENGTH, MAX_NOTES_LENGTH } from "../globals/limits.ts";
import { cents, flag, id, isoDate, optional, requiredText, text, time } from "./fields.ts";

export const appointmentSchema = z.object({
  pet_id: id(MESSAGES.appointment.petRequired),
  servico: requiredText(MAX_LIST_ITEM_LENGTH, {
    required: MESSAGES.appointment.serviceRequired,
    tooLong: MESSAGES.textTooLong("O serviço", MAX_LIST_ITEM_LENGTH),
  }),
  data: isoDate(MESSAGES.date.invalid),
  hora: time(MESSAGES.appointment.timeInvalid, MESSAGES.appointment.timeRequired),
  valor: cents(MESSAGES.money.invalid),
  // Opcional na tela; o banco guarda o texto vazio quando não há escolha.
  tipo_pgto: text(MAX_LIST_ITEM_LENGTH, MESSAGES.textTooLong("O tipo de pagamento", MAX_LIST_ITEM_LENGTH)),
  observacao: optional(
    text(MAX_NOTES_LENGTH, MESSAGES.textTooLong("A observação do agendamento", MAX_NOTES_LENGTH)),
  ),
  entregar_pet: flag("Entregar pet"),
  concluido: flag("Concluído"),
  is_auto_agen: flag("Agendamento automático"),
  ta_pago: flag("Pago"),
});

/** O agendamento conferido: o que o service recebe para gravar. */
export type AppointmentData = z.output<typeof appointmentSchema>;
