// SQL dos pets sem depender do Expo: o PetRepository e os testes executam os mesmos comandos.
//
// Desde a versão 6 do esquema (DADOS-4), o pet guarda o serviço padrão pelo id (servico_padrao_id). As
// telas continuam com o nome (servico_padrao): a leitura traz o nome pelo JOIN, e a gravação acha o id
// pelo nome (listsSql.ts).
import { pagedNameSearch, type PagedSql } from "./searchSql.ts";
import { SERVICE_ID_BY_NAME_SQL } from "./listsSql.ts";
import type { NameSearch } from "../../model/Search";

/** A página de pets da busca, com a espécie, a raça e o dono, e o total, com o mesmo filtro. */
export const searchPetsSql = (search: NameSearch): PagedSql =>
  pagedNameSearch(
    {
      columns: `PT.*,
        ST.servico   AS servico_padrao,
        SP.nome      AS nome_especie,
        RC.nome_raca AS nome_raca,
        OW.nome      AS nome_dono`,
      from: `FROM pets    AS PT
       JOIN species AS SP ON PT.especie = SP.id
       JOIN race    AS RC ON PT.raca    = RC.id
       JOIN owners  AS OW ON PT.dono_id = OW.id
       JOIN service_type AS ST ON PT.servico_padrao_id = ST.id`,
      alias: "PT",
    },
    search,
  );

/**
 * Parâmetros: nome, nome_normalizado, especie, porte, raca, observacoes, dono_id, servico_padrao (nome),
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
        servico_padrao_id, 
        remarcacao_ativa, 
        pacote_remarcacao, 
        data_inicio_pacote, 
        horario_padrao,
        valor_pacote
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ${SERVICE_ID_BY_NAME_SQL}, ?, ?, ?, ?, ?)`;

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
        servico_padrao_id = ${SERVICE_ID_BY_NAME_SQL}, 
        remarcacao_ativa = ?,
        pacote_remarcacao = ?, 
        data_inicio_pacote = ?,
        horario_padrao = ?,
        valor_pacote = ?
       WHERE id = ?`;


/** Parâmetros: id. O pet com as colunas do modelo, sem o `nome_normalizado`, que é só da busca. */
export const FIND_PET_SQL = `SELECT PT.id, PT.nome, PT.especie, PT.porte, PT.raca, PT.observacoes, PT.dono_id,
  ST.servico AS servico_padrao, PT.valor_pacote, PT.remarcacao_ativa, PT.pacote_remarcacao,
  PT.data_inicio_pacote, PT.horario_padrao, PT.current_ultima_visita_data, PT.ultimo_visita_data_auto,
  PT.is_ativo, PT.criado_em
  FROM pets AS PT
  JOIN service_type AS ST ON PT.servico_padrao_id = ST.id
  WHERE PT.id = ?`;

/** Parâmetros: id. Exclusão lógica; o trigger limpa o pacote e os automáticos futuros. */
export const DEACTIVATE_PET_SQL = `UPDATE pets SET is_ativo = 0 WHERE id = ?`;

/**
 * Parâmetros: id. O trigger trg_pet_ativar_owner reativa o dono, se estiver inativo, e o
 * PackageScheduleService refaz a agenda se o pacote estiver ligado.
 */
export const ACTIVATE_PET_SQL = `UPDATE pets SET is_ativo = 1 WHERE id = ?`;

/** Parâmetros: id. As colunas do pet que a remarcação lê (PetPackage, em domain/packageSchedule.ts). */
export const FIND_PET_PACKAGE_SQL = `SELECT remarcacao_ativa, pacote_remarcacao, data_inicio_pacote, valor_pacote,
  horario_padrao, servico_padrao_id, is_ativo, ultimo_visita_data_auto
  FROM pets WHERE id = ?`;

/** Parâmetros: id, id. Aponta o pet para o último automático em aberto, ou nulo se não houver. */
export const REFRESH_LAST_AUTO_VISIT_SQL = `UPDATE pets
  SET ultimo_visita_data_auto = (
    SELECT MAX(data) FROM appointments
    WHERE pet_id = ? AND is_auto_agen = 1 AND concluido = 0
  )
  WHERE id = ?`;
