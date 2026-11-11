// SQL dos agendamentos sem depender do Expo: o AppointmentsRepository e os testes executam os mesmos
// comandos.
//
// Desde a versão 6 do esquema (DADOS-4), o agendamento guarda o serviço e a forma de pagamento pelo id
// e também pelo nome da época (service_name e payment_method_name). As telas continuam com o nome: a leitura
// traz o nome gravado no próprio agendamento, e a gravação acha o id pelo nome entre os itens ativos.
// Renomear um item da lista, então, não muda o histórico. Sem forma de pagamento (id e nome nulos), a
// leitura traz o texto vazio, como a tela grava.

import type { Appointment } from "../../model/Appointment.ts";
import { ACTIVE_PAYMENT_METHOD_ID_BY_NAME_SQL, ACTIVE_SERVICE_ID_BY_NAME_SQL } from "./listsSql.ts";

/** O que o banco recebe como parâmetro. */
export type SqlValue = string | number | null;

/** As colunas do agendamento como as telas leem (model/Appointment.ts), com o apelido AP. */
export const APPOINTMENT_COLUMNS = `AP.id, AP.pet_id, AP.service_name AS service, AP.date, AP.time,
  AP.deliver_pet, AP.completed, AP.notes, AP.is_auto, AP.price,
  COALESCE(AP.payment_method_name, '') AS payment_method, AP.is_paid, AP.created_at`;

/** A tabela com o apelido AP, para ler com o APPOINTMENT_COLUMNS: o nome vem da própria linha. */
export const APPOINTMENTS_TABLE = "appointments AS AP";

/** Parâmetros: id. */
export const FIND_APPOINTMENT_SQL = `SELECT ${APPOINTMENT_COLUMNS} FROM ${APPOINTMENTS_TABLE}
  WHERE AP.id = ?`;

/** Parâmetro: a data. Os agendamentos do dia, com o pet, a espécie e o dono, os pendentes primeiro. */
export const LIST_APPOINTMENTS_OF_DAY_SQL = `SELECT ${APPOINTMENT_COLUMNS},
    PT.name AS pet_name,
    SP.name AS species_name,
    OW.name AS owner_name
  FROM ${APPOINTMENTS_TABLE}
  JOIN pets    AS PT ON AP.pet_id = PT.id
  JOIN owners  AS OW ON PT.owner_id = OW.id
  JOIN species AS SP ON PT.species_id = SP.id
  WHERE AP.date = ?
  ORDER BY AP.completed, AP.time ASC`;

/** Parâmetros: a primeira e a última data, inclusive. */
export const LIST_APPOINTMENTS_BETWEEN_SQL = `SELECT ${APPOINTMENT_COLUMNS} FROM ${APPOINTMENTS_TABLE}
  WHERE AP.date BETWEEN ? AND ?
  ORDER BY AP.date ASC`;

/** O agendamento como o formulário grava, com o serviço e a forma de pagamento pelo nome. */
export type AppointmentWrite = Pick<
  Appointment,
  | "pet_id"
  | "service"
  | "date"
  | "time"
  | "deliver_pet"
  | "completed"
  | "notes"
  | "is_auto"
  | "price"
  | "payment_method"
  | "is_paid"
>;

/**
 * Cria o agendamento com o nome do serviço e da forma de pagamento escolhidos. O id vem só dos itens
 * ativos: um nome fora da lista (ou oculto) dá id nulo, e o banco recusa (NOT NULL do serviço, CHECK do
 * par id e nome do pagamento).
 */
export const INSERT_APPOINTMENT_SQL = `INSERT INTO appointments
        (pet_id, service_id, service_name, date, time, deliver_pet, completed, notes, is_auto,
         price, payment_method_id, payment_method_name, is_paid)
       VALUES
        (?, ${ACTIVE_SERVICE_ID_BY_NAME_SQL}, ?, ?, ?, ?, ?, ?, ?, ?,
         ${ACTIVE_PAYMENT_METHOD_ID_BY_NAME_SQL}, NULLIF(?, ''), ?)`;

/** Os parâmetros do INSERT_APPOINTMENT_SQL, na ordem dele. */
export const insertAppointmentParams = (appointment: AppointmentWrite): SqlValue[] => [
  appointment.pet_id,
  appointment.service,
  appointment.service,
  appointment.date,
  appointment.time,
  appointment.deliver_pet,
  appointment.completed,
  appointment.notes ?? null,
  appointment.is_auto,
  appointment.price,
  appointment.payment_method,
  appointment.payment_method,
  appointment.is_paid,
];

/**
 * Salva o agendamento. Se o nome do serviço (ou da forma de pagamento) não mudou, o id fica: editar
 * outro campo não troca o item, mesmo depois de ele ser renomeado ou ocultado. Se mudou, o id vem do
 * item ativo de nome igual ao novo. Cita sempre o completed, mas a última visita (trg_last_visit) e
 * o próximo automático (PackageScheduleService) só mudam quando ele passa de 0 para 1 (BUG-3). Os
 * valores antigos das colunas valem em todas as expressões do SET.
 */
export const UPDATE_APPOINTMENT_SQL = `UPDATE appointments SET
        pet_id = ?,
        service_id = CASE WHEN service_name = ? THEN service_id ELSE ${ACTIVE_SERVICE_ID_BY_NAME_SQL} END,
        service_name = ?,
        date = ?,
        time = ?,
        deliver_pet = ?,
        completed = ?,
        notes = ?,
        price = ?,
        payment_method_id = CASE WHEN payment_method_name IS NULLIF(?, '') THEN payment_method_id
          ELSE ${ACTIVE_PAYMENT_METHOD_ID_BY_NAME_SQL} END,
        payment_method_name = NULLIF(?, ''),
        is_paid = ?
       WHERE id = ?`;

/** Os parâmetros do UPDATE_APPOINTMENT_SQL, na ordem dele. */
export const updateAppointmentParams = (appointment: AppointmentWrite, id: number): SqlValue[] => [
  appointment.pet_id,
  appointment.service,
  appointment.service,
  appointment.service,
  appointment.date,
  appointment.time,
  appointment.deliver_pet,
  appointment.completed,
  appointment.notes ?? null,
  appointment.price,
  appointment.payment_method,
  appointment.payment_method,
  appointment.payment_method,
  appointment.is_paid,
  id,
];

// ── Remarcação automática ─────────────────────────────────────────────────
// Os comandos do PackageScheduleService. A regra fica em domain/packageSchedule.ts.

/** Parâmetros: id. O que a conclusão de um agendamento olha antes e depois de salvar. */
export const FIND_APPOINTMENT_STATE_SQL = `SELECT pet_id, service_id, date, deliver_pet, completed,
  notes, is_auto
  FROM appointments WHERE id = ?`;

/**
 * Parâmetros: pet_id, service_id, service_id, data, hora, deliver_pet, observacao, is_auto, valor.
 * Um atendimento da agenda do pacote; o pagamento e o concluído ficam no padrão da tabela. O nome do
 * serviço é o que o id tem agora, o mesmo que o pet mostra.
 */
export const INSERT_PACKAGE_VISIT_SQL = `INSERT INTO appointments
        (pet_id, service_id, service_name, date, time, deliver_pet, notes, is_auto, price)
       VALUES
        (?, ?, (SELECT name FROM services WHERE id = ?), ?, ?, ?, ?, ?, ?)`;

/** Parâmetros: pet_id, data. Apaga os automáticos pendentes do pet a partir da data. */
export const DELETE_PENDING_AUTO_FROM_SQL = `DELETE FROM appointments
  WHERE pet_id = ? AND is_auto = 1 AND completed = 0 AND date >= ?`;

/** Parâmetros: pet_id, data. Os dias, a partir da data, em que o pet tem um atendimento concluído. */
export const LIST_CONCLUDED_DATES_FROM_SQL = `SELECT DISTINCT date FROM appointments
  WHERE pet_id = ? AND completed = 1 AND date >= ?`;

/** Parâmetros: pet_id, mês ("AAAA-MM"). Os automáticos pendentes do pet no mês. */
export const COUNT_PENDING_AUTO_IN_MONTH_SQL = `SELECT COUNT(*) AS total FROM appointments
  WHERE pet_id = ? AND is_auto = 1 AND completed = 0 AND strftime('%Y-%m', date) = ?`;

/** Parâmetros: pet_id, mês ("AAAA-MM"). Os automáticos do pet no mês, concluídos ou não. */
export const COUNT_AUTO_IN_MONTH_SQL = `SELECT COUNT(*) AS total FROM appointments
  WHERE pet_id = ? AND is_auto = 1 AND strftime('%Y-%m', date) = ?`;
