// SQL dos agendamentos sem depender do Expo: o AppointmentsRepository e os testes executam os mesmos
// comandos.
//
// Desde a versão 6 do esquema (DADOS-4), o agendamento guarda o serviço e a forma de pagamento pelo id.
// As telas continuam com o nome: a leitura traz o nome pelo JOIN, e a gravação acha o id pelo nome.
// Sem forma de pagamento (id nulo), a leitura traz o texto vazio, como a tela grava.

import { PAYMENT_METHOD_ID_BY_NAME_SQL, SERVICE_ID_BY_NAME_SQL } from "./listsSql.ts";

/** As colunas do agendamento como as telas leem (model/Appointment.ts), com o apelido AP. */
export const APPOINTMENT_COLUMNS = `AP.id, AP.pet_id, ST.servico AS servico, AP.data, AP.hora,
  AP.entregar_pet, AP.concluido, AP.observacao, AP.is_auto_agen, AP.valor,
  COALESCE(PM.tipo_pgto, '') AS tipo_pgto, AP.ta_pago, AP.criado_em`;

/** O agendamento com os nomes das listas, para ler com o APPOINTMENT_COLUMNS. */
export const APPOINTMENTS_WITH_NAMES = `appointments AS AP
  JOIN service_type AS ST ON ST.id = AP.servico_id
  LEFT JOIN payment_methods AS PM ON PM.id = AP.tipo_pgto_id`;

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

/**
 * Parâmetros: pet_id, servico (nome), data, hora, entregar_pet, concluido, observacao, is_auto_agen,
 * valor, tipo_pgto (nome ou vazio), ta_pago. O repositório sempre passa concluido = 0 e
 * is_auto_agen = 0 (manual).
 */
export const INSERT_APPOINTMENT_SQL = `INSERT INTO appointments
        (pet_id, servico_id, data, hora, entregar_pet, concluido, observacao, is_auto_agen, valor, tipo_pgto_id, ta_pago)
       VALUES
        (?, ${SERVICE_ID_BY_NAME_SQL}, ?, ?, ?, ?, ?, ?, ?, ${PAYMENT_METHOD_ID_BY_NAME_SQL}, ?)`;

/**
 * Parâmetros: pet_id, servico (nome), data, hora, entregar_pet, concluido, observacao, valor,
 * tipo_pgto (nome ou vazio), ta_pago, id. Cita sempre o concluido, mas a última visita
 * (trg_ultima_visita) e o próximo automático (PackageScheduleService) só mudam quando ele passa de 0
 * para 1 (BUG-3).
 */
export const UPDATE_APPOINTMENT_SQL = `UPDATE appointments SET
        pet_id = ?,
        servico_id = ${SERVICE_ID_BY_NAME_SQL},
        data = ?,
        hora = ?,
        entregar_pet = ?,
        concluido = ?,
        observacao = ?,
        valor = ?,
        tipo_pgto_id = ${PAYMENT_METHOD_ID_BY_NAME_SQL},
        ta_pago = ?
       WHERE id = ?`;

// ── Remarcação automática ─────────────────────────────────────────────────
// Os comandos do PackageScheduleService. A regra fica em domain/packageSchedule.ts.

/** Parâmetros: id. O que a conclusão de um agendamento olha antes e depois de salvar. */
export const FIND_APPOINTMENT_STATE_SQL = `SELECT pet_id, servico_id, data, entregar_pet, concluido,
  observacao, is_auto_agen
  FROM appointments WHERE id = ?`;

/**
 * Parâmetros: pet_id, servico_id, data, hora, entregar_pet, observacao, is_auto_agen, valor. Um
 * atendimento da agenda do pacote; o pagamento e o concluído ficam no padrão da tabela.
 */
export const INSERT_PACKAGE_VISIT_SQL = `INSERT INTO appointments
        (pet_id, servico_id, data, hora, entregar_pet, observacao, is_auto_agen, valor)
       VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)`;

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
