// O agendamento (VALID-1). Sem depender do Expo, para os testes rodarem no Node, que exige a extensão
// .ts nos imports.
import * as z from "zod";
import { MESSAGES } from "../globals/messages.ts";
import { MAX_LIST_ITEM_LENGTH, MAX_NOTES_LENGTH } from "../globals/limits.ts";
import { cents, flag, id, isoDate, optional, requiredText, text, time } from "./fields.ts";

/** Os textos do agendamento que já estão gravados, para a edição não recusar o que não mudou. */
export interface StoredAppointmentTexts {
  servico?: string;
  tipo_pgto?: string;
  observacao?: string | null;
}

/**
 * O schema do agendamento. Na edição, recebe o que está gravado: os limites de tamanho do serviço, da
 * forma de pagamento e da observação valem só para o que mudou (ver `text`).
 */
export const appointmentSchemaFor = (stored: StoredAppointmentTexts = {}) =>
  z.object({
    pet_id: id(MESSAGES.appointment.petRequired),
    servico: requiredText(
      MAX_LIST_ITEM_LENGTH,
      {
        required: MESSAGES.appointment.serviceRequired,
        tooLong: MESSAGES.textTooLong("O serviço", MAX_LIST_ITEM_LENGTH),
      },
      stored.servico,
    ),
    data: isoDate(MESSAGES.date.invalid),
    hora: time(MESSAGES.appointment.timeInvalid, MESSAGES.appointment.timeRequired),
    valor: cents(MESSAGES.money.invalid),
    // Opcional na tela. O vazio é a forma não informada, que o banco guarda como id nulo (versão 6).
    tipo_pgto: text(
      MAX_LIST_ITEM_LENGTH,
      MESSAGES.textTooLong("O tipo de pagamento", MAX_LIST_ITEM_LENGTH),
      stored.tipo_pgto,
    ),
    observacao: optional(
      text(
        MAX_NOTES_LENGTH,
        MESSAGES.textTooLong("A observação do agendamento", MAX_NOTES_LENGTH),
        stored.observacao,
      ),
    ),
    entregar_pet: flag("Entregar pet"),
    concluido: flag("Concluído"),
    is_auto_agen: flag("Agendamento automático"),
    ta_pago: flag("Pago"),
  });

/** O schema da criação, sem nada gravado. */
export const appointmentSchema = appointmentSchemaFor();

/** O agendamento conferido: o que o service recebe para gravar. */
export type AppointmentData = z.output<typeof appointmentSchema>;
