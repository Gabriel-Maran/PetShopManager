// SQL dos donos sem depender do Expo: o OwnerRepository e os testes executam os mesmos comandos.

/** Parâmetros: nome, nome_normalizado, telefone, email, endereco. */
export const INSERT_OWNER_SQL = `INSERT INTO owners (nome, nome_normalizado, telefone, email, endereco) VALUES (?, ?, ?, ?, ?)`;

/** Parâmetros: id. Exclusão lógica; o trigger trg_owner_desativar_pets desativa os pets do dono. */
export const DEACTIVATE_OWNER_SQL = `UPDATE owners SET is_ativo = 0 WHERE id = ?`;

/** Parâmetros: id. */
export const ACTIVATE_OWNER_SQL = `UPDATE owners SET is_ativo = 1 WHERE id = ?`;
