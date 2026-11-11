// SQL dos agendamentos sem depender do Expo: o AppointmentsRepository e os testes executam os mesmos
// comandos.
//
// Desde a versão 6 do esquema (DADOS-4), o agendamento guarda o serviço e a forma de pagamento pelo id
// e também pelo nome da época (servico_nome e tipo_pgto_nome). As telas continuam com o nome: a leitura
// traz o nome gravado no próprio agendamento, e a gravação acha o id pelo nome entre os itens ativos.
// Renomear um item da lista, então, não muda o histórico. Sem forma de pagamento (id e nome nulos), a
// leitura traz o texto vazio, como a tela grava.

import type { Appointment } from "../../model/Appointment.ts";
import { ACTIVE_PAYMENT_METHOD_ID_BY_NAME_SQL, ACTIVE_SERVICE_ID_BY_NAME_SQL } from "./listsSql.ts";

/** O que o banco recebe como parâmetro. */
export type SqlValue = string | number | null;

/** As colunas do agendamento como as telas leem (model/Appointment.ts), com o apelido AP. */
export const APPOINTMENT_COLUMNS = `AP.id, AP.pet_id, AP.servico_nome AS servico, AP.data, AP.hora,
  AP.entregar_pet, AP.concluido, AP.observacao, AP.is_auto_agen, AP.valor,
  COALESCE(AP.tipo_pgto_nome, '') AS tipo_pgto, AP.ta_pago, AP.criado_em`;

/** A tabela com o apelido AP, para ler com o APPOINTMENT_COLUMNS: o nome vem da própria linha. */
export const APPOINTMENTS_WITH_NAMES = "appointments AS AP";

/** Parâmetros: id. */
export const FIND_APPOINTMENT_SQL = `SELECT ${APPOINTMENT_COLUMNS} FROM ${APPOINTMENTS_WITH_NAMES}
  WHERE AP.id = ?`;

/** Parâmetro: a data. Os agendamentos do dia, com o pet, a espécie e o dono, os pendentes primeiro. */
export const LIST_APPOINTMENTS_OF_DAY_SQL = `SELECT ${APPOINTMENT_COLUMNS},
    PT.nome AS nome_pet,
    SP.nome AS especie,
    OW.nome AS nome_dono
  FROM ${APPOINTMENTS_WITH_NAMES}
  JOIN pets    AS PT ON AP.pet_id = PT.id
  JOIN owners  AS OW ON PT.dono_id = OW.id
  JOIN species AS SP ON PT.especie = SP.id
  WHERE AP.data = ?
  ORDER BY AP.concluido, AP.hora ASC`;

/** Parâmetros: a primeira e a última data, inclusive. */
export const LIST_APPOINTMENTS_BETWEEN_SQL = `SELECT ${APPOINTMENT_COLUMNS} FROM ${APPOINTMENTS_WITH_NAMES}
  WHERE AP.data BETWEEN ? AND ?
  ORDER BY AP.data ASC`;

/** O agendamento como o formulário grava, com o serviço e a forma de pagamento pelo nome. */
export type AppointmentWrite = Pick<
  Appointment,
  | "pet_id"
  | "servico"
  | "data"
  | "hora"
  | "entregar_pet"
  | "concluido"
  | "observacao"
  | "is_auto_agen"
  | "valor"
  | "tipo_pgto"
  | "ta_pago"
>;

/**
 * Cria o agendamento com o nome do serviço e da forma de pagamento escolhidos. O id vem só dos itens
 * ativos: um nome fora da lista (ou oculto) dá id nulo, e o banco recusa (NOT NULL do serviço, CHECK do
 * par id e nome do pagamento).
 */
export const INSERT_APPOINTMENT_SQL = `INSERT INTO appointments
        (pet_id, servico_id, servico_nome, data, hora, entregar_pet, concluido, observacao, is_auto_agen,
         valor, tipo_pgto_id, tipo_pgto_nome, ta_pago)
       VALUES
        (?, ${ACTIVE_SERVICE_ID_BY_NAME_SQL}, ?, ?, ?, ?, ?, ?, ?, ?,
         ${ACTIVE_PAYMENT_METHOD_ID_BY_NAME_SQL}, NULLIF(?, ''), ?)`;

/** Os parâmetros do INSERT_APPOINTMENT_SQL, na ordem dele. */
export const insertAppointmentParams = (appointment: AppointmentWrite): SqlValue[] => [
  appointment.pet_id,
  appointment.servico,
  appointment.servico,
  appointment.data,
  appointment.hora,
  appointment.entregar_pet,
  appointment.concluido,
  appointment.observacao ?? null,
  appointment.is_auto_agen,
  appointment.valor,
  appointment.tipo_pgto,
  appointment.tipo_pgto,
  appointment.ta_pago,
];

/**
 * Salva o agendamento. Se o nome do serviço (ou da forma de pagamento) não mudou, o id fica: editar
 * outro campo não troca o item, mesmo depois de ele ser renomeado ou ocultado. Se mudou, o id vem do
 * item ativo de nome igual ao novo. Cita sempre o concluido, mas a última visita (trg_ultima_visita) e
 * o próximo automático (PackageScheduleService) só mudam quando ele passa de 0 para 1 (BUG-3). Os
 * valores antigos das colunas valem em todas as expressões do SET.
 */
export const UPDATE_APPOINTMENT_SQL = `UPDATE appointments SET
        pet_id = ?,
        servico_id = CASE WHEN servico_nome = ? THEN servico_id ELSE ${ACTIVE_SERVICE_ID_BY_NAME_SQL} END,
        servico_nome = ?,
        data = ?,
        hora = ?,
        entregar_pet = ?,
        concluido = ?,
        observacao = ?,
        valor = ?,
        tipo_pgto_id = CASE WHEN tipo_pgto_nome IS NULLIF(?, '') THEN tipo_pgto_id
          ELSE ${ACTIVE_PAYMENT_METHOD_ID_BY_NAME_SQL} END,
        tipo_pgto_nome = NULLIF(?, ''),
        ta_pago = ?
       WHERE id = ?`;

/** Os parâmetros do UPDATE_APPOINTMENT_SQL, na ordem dele. */
export const updateAppointmentParams = (appointment: AppointmentWrite, id: number): SqlValue[] => [
  appointment.pet_id,
  appointment.servico,
  appointment.servico,
  appointment.servico,
  appointment.data,
  appointment.hora,
  appointment.entregar_pet,
  appointment.concluido,
  appointment.observacao ?? null,
  appointment.valor,
  appointment.tipo_pgto,
  appointment.tipo_pgto,
  appointment.tipo_pgto,
  appointment.ta_pago,
  id,
];

// ── Remarcação automática ─────────────────────────────────────────────────
// Os comandos do PackageScheduleService. A regra fica em domain/packageSchedule.ts.

/** Parâmetros: id. O que a conclusão de um agendamento olha antes e depois de salvar. */
export const FIND_APPOINTMENT_STATE_SQL = `SELECT pet_id, servico_id, data, entregar_pet, concluido,
  observacao, is_auto_agen
  FROM appointments WHERE id = ?`;

/**
 * Parâmetros: pet_id, servico_id, servico_id, data, hora, entregar_pet, observacao, is_auto_agen, valor.
 * Um atendimento da agenda do pacote; o pagamento e o concluído ficam no padrão da tabela. O nome do
 * serviço é o que o id tem agora, o mesmo que o pet mostra.
 */
export const INSERT_PACKAGE_VISIT_SQL = `INSERT INTO appointments
        (pet_id, servico_id, servico_nome, data, hora, entregar_pet, observacao, is_auto_agen, valor)
       VALUES
        (?, ?, (SELECT servico FROM service_type WHERE id = ?), ?, ?, ?, ?, ?, ?)`;

/** Parâmetros: pet_id, data. Apaga os automáticos pendentes do pet a partir da data. */
export const DELETE_PENDING_AUTO_FROM_SQL = `DELETE FROM appointments
  WHERE pet_id = ? AND is_auto_agen = 1 AND concluido = 0 AND data >= ?`;

/** Parâmetros: pet_id, data. Os dias, a partir da data, em que o pet tem um atendimento concluído. */
export const LIST_CONCLUDED_DATES_FROM_SQL = `SELECT DISTINCT data FROM appointments
  WHERE pet_id = ? AND concluido = 1 AND data >= ?`;

/** Parâmetros: pet_id, mês ("AAAA-MM"). Os automáticos pendentes do pet no mês. */
export const COUNT_PENDING_AUTO_IN_MONTH_SQL = `SELECT COUNT(*) AS total FROM appointments
  WHERE pet_id = ? AND is_auto_agen = 1 AND concluido = 0 AND strftime('%Y-%m', data) = ?`;

/** Parâmetros: pet_id, mês ("AAAA-MM"). Os automáticos do pet no mês, concluídos ou não. */
export const COUNT_AUTO_IN_MONTH_SQL = `SELECT COUNT(*) AS total FROM appointments
  WHERE pet_id = ? AND is_auto_agen = 1 AND strftime('%Y-%m', data) = ?`;
