// SQL dos pets sem depender do Expo: o PetRepository e os testes executam os mesmos comandos.
import { pagedNameSearch, type PagedSql } from "./searchSql.ts";
import type { NameSearch } from "../../model/Search";

/** A página de pets da busca, com a espécie, a raça e o dono, e o total, com o mesmo filtro. */
export const searchPetsSql = (search: NameSearch): PagedSql =>
  pagedNameSearch(
    {
      columns: `PT.*,
        SP.nome      AS nome_especie,
        RC.nome_raca AS nome_raca,
        OW.nome      AS nome_dono`,
      from: `FROM pets    AS PT
       JOIN species AS SP ON PT.especie = SP.id
       JOIN race    AS RC ON PT.raca    = RC.id
       JOIN owners  AS OW ON PT.dono_id = OW.id`,
      alias: "PT",
    },
    search,
  );

/**
 * Parâmetros: nome, nome_normalizado, especie, porte, raca, observacoes, dono_id, servico_padrao,
 * remarcacao_ativa, pacote_remarcacao, data_inicio_pacote, horario_padrao, valor_pacote.
 * Com remarcação ativa, o PackageScheduleService gera a agenda do pacote na mesma transação.
 */
export const INSERT_PET_SQL = `INSERT INTO pets (
        nome, 
        nome_normalizado, 
        especie, 
        porte, 
        raca, 
        observacoes,
        dono_id, 
        servico_padrao, 
        remarcacao_ativa, 
        pacote_remarcacao, 
        data_inicio_pacote, 
        horario_padrao,
        valor_pacote
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

/**
 * Parâmetros: os mesmos do INSERT_PET_SQL, na mesma ordem, mais o id no fim. Regrava todos os
 * campos, mas o PackageScheduleService só refaz a agenda quando um campo dela muda de fato (BUG-4).
 */
export const UPDATE_PET_SQL = `UPDATE pets SET
        nome = ?, 
        nome_normalizado = ?, 
        especie = ?, 
        porte = ?, 
        raca = ?,
        observacoes = ?, 
        dono_id = ?, 
        servico_padrao = ?, 
        remarcacao_ativa = ?,
        pacote_remarcacao = ?, 
        data_inicio_pacote = ?,
        horario_padrao = ?,
        valor_pacote = ?
       WHERE id = ?`;


/** Parâmetros: id. O pet com as colunas do modelo, sem o `nome_normalizado`, que é só da busca. */
export const FIND_PET_SQL = `SELECT id, nome, especie, porte, raca, observacoes, dono_id, servico_padrao, valor_pacote,
  remarcacao_ativa, pacote_remarcacao, data_inicio_pacote, horario_padrao, current_ultima_visita_data,
  ultimo_visita_data_auto, is_ativo, criado_em
  FROM pets WHERE id = ?`;

/** Parâmetros: id. Exclusão lógica; o trigger limpa o pacote e os automáticos futuros. */
export const DEACTIVATE_PET_SQL = `UPDATE pets SET is_ativo = 0 WHERE id = ?`;

/**
 * Parâmetros: id. O trigger trg_pet_ativar_owner reativa o dono, se estiver inativo, e o
 * PackageScheduleService refaz a agenda se o pacote estiver ligado.
 */
export const ACTIVATE_PET_SQL = `UPDATE pets SET is_ativo = 1 WHERE id = ?`;

/** Parâmetros: id. As colunas do pet que a remarcação lê (PetPackage, em domain/packageSchedule.ts). */
export const FIND_PET_PACKAGE_SQL = `SELECT remarcacao_ativa, pacote_remarcacao, data_inicio_pacote, valor_pacote,
  horario_padrao, servico_padrao, is_ativo, ultimo_visita_data_auto
  FROM pets WHERE id = ?`;

/** Parâmetros: id, id. Aponta o pet para o último automático em aberto, ou nulo se não houver. */
export const REFRESH_LAST_AUTO_VISIT_SQL = `UPDATE pets
  SET ultimo_visita_data_auto = (
    SELECT MAX(data) FROM appointments
    WHERE pet_id = ? AND is_auto_agen = 1 AND concluido = 0
  )
  WHERE id = ?`;
