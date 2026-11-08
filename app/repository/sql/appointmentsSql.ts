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
 * ta_pago, id. Cita sempre o concluido, mas os triggers de conclusão só agem quando ele passa de 0
 * para 1 (BUG-3, corrigido na versão 2 do esquema).
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

/** Parâmetros: id. Dispara o trg_ultima_visita e, se for automático, o trg_remarcacao_automatica. */
export const CONCLUDE_APPOINTMENT_SQL = `UPDATE appointments SET concluido = 1 WHERE id = ?`;
