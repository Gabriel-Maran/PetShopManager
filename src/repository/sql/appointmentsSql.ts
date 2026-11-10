// SQL dos agendamentos sem depender do Expo: o AppointmentsRepository e os testes executam os mesmos
// comandos.

/**
 * Parâmetros: pet_id, servico, data, hora, entregar_pet, concluido, observacao, is_auto_agen, valor,
 * tipo_pgto, ta_pago. O repositório sempre passa concluido = 0 e is_auto_agen = 0 (manual).
 */
export const INSERT_APPOINTMENT_SQL = `INSERT INTO appointments
        (pet_id, servico, data, hora, entregar_pet, concluido, observacao, is_auto_agen, valor, tipo_pgto, ta_pago)
       VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

/**
 * Parâmetros: pet_id, servico, data, hora, entregar_pet, concluido, observacao, valor, tipo_pgto,
 * ta_pago, id. Cita sempre o concluido, mas a última visita (trg_ultima_visita) e o próximo
 * automático (PackageScheduleService) só mudam quando ele passa de 0 para 1 (BUG-3).
 */
export const UPDATE_APPOINTMENT_SQL = `UPDATE appointments SET
        pet_id = ?,
        servico = ?,
        data = ?,
        hora = ?,
        entregar_pet = ?,
        concluido = ?,
        observacao = ?,
        valor = ?,
        tipo_pgto = ?,
        ta_pago = ?
       WHERE id = ?`;

// ── Remarcação automática ─────────────────────────────────────────────────
// Os comandos do PackageScheduleService. A regra fica em domain/packageSchedule.ts.

/** Parâmetros: id. O que a conclusão de um agendamento olha antes e depois de salvar. */
export const FIND_APPOINTMENT_STATE_SQL = `SELECT pet_id, servico, data, entregar_pet, concluido, observacao,
  is_auto_agen
  FROM appointments WHERE id = ?`;

/**
 * Parâmetros: pet_id, servico, data, hora, entregar_pet, observacao, is_auto_agen, valor. Um
 * atendimento da agenda do pacote; o pagamento e o concluído ficam no padrão da tabela.
 */
export const INSERT_PACKAGE_VISIT_SQL = `INSERT INTO appointments
        (pet_id, servico, data, hora, entregar_pet, observacao, is_auto_agen, valor)
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
