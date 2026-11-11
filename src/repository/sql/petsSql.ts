// SQL dos pets sem depender do Expo: o PetRepository e os testes executam os mesmos comandos.
//
// Desde a versão 6 do esquema (DADOS-4), o pet guarda o serviço padrão pelo id (default_service_id). As
// telas continuam com o nome (default_service): a leitura traz o nome pelo JOIN, e a gravação acha o id
// pelo nome (listsSql.ts).
import { pagedNameSearch, type PagedSql } from "./searchSql.ts";
import { SERVICE_ID_BY_NAME_SQL } from "./listsSql.ts";
import type { NameSearch } from "../../model/Search";

/** A página de pets da busca, com a espécie, a raça e o dono, e o total, com o mesmo filtro. */
export const searchPetsSql = (search: NameSearch): PagedSql =>
  pagedNameSearch(
    {
      columns: `PT.*,
        ST.name AS default_service,
        SP.name AS species_name,
        RC.name AS breed_name,
        OW.name AS owner_name`,
      from: `FROM pets    AS PT
       JOIN species AS SP ON PT.species_id = SP.id
       JOIN breeds    AS RC ON PT.breed_id    = RC.id
       JOIN owners  AS OW ON PT.owner_id = OW.id
       JOIN services AS ST ON PT.default_service_id = ST.id`,
      alias: "PT",
    },
    search,
  );

/**
 * Parâmetros: name, normalized_name, species_id, size, breed_id, notes, owner_id, default_service (o nome),
 * reschedule_active, package_frequency, package_start_date, default_time, package_price.
 * Com remarcação ativa, o PackageScheduleService gera a agenda do pacote na mesma transação.
 */
export const INSERT_PET_SQL = `INSERT INTO pets (
        name, 
        normalized_name, 
        species_id, 
        size, 
        breed_id, 
        notes,
        owner_id, 
        default_service_id, 
        reschedule_active, 
        package_frequency, 
        package_start_date, 
        default_time,
        package_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ${SERVICE_ID_BY_NAME_SQL}, ?, ?, ?, ?, ?)`;

/**
 * Parâmetros: os mesmos do INSERT_PET_SQL, na mesma ordem, mais o id no fim. Regrava todos os
 * campos, mas o PackageScheduleService só refaz a agenda quando um campo dela muda de fato (BUG-4).
 */
export const UPDATE_PET_SQL = `UPDATE pets SET
        name = ?, 
        normalized_name = ?, 
        species_id = ?, 
        size = ?, 
        breed_id = ?,
        notes = ?, 
        owner_id = ?, 
        default_service_id = ${SERVICE_ID_BY_NAME_SQL}, 
        reschedule_active = ?,
        package_frequency = ?, 
        package_start_date = ?,
        default_time = ?,
        package_price = ?
       WHERE id = ?`;

/** Parâmetros: id. O pet com as colunas do modelo, sem o `normalized_name`, que é só da busca. */
export const FIND_PET_SQL = `SELECT PT.id, PT.name, PT.species_id, PT.size, PT.breed_id, PT.notes, PT.owner_id,
  ST.name AS default_service, PT.package_price, PT.reschedule_active, PT.package_frequency,
  PT.package_start_date, PT.default_time, PT.last_visit_date, PT.last_auto_visit_date,
  PT.is_active, PT.created_at
  FROM pets AS PT
  JOIN services AS ST ON PT.default_service_id = ST.id
  WHERE PT.id = ?`;

/** Parâmetros: id. Exclusão lógica; o trigger limpa o pacote e os automáticos futuros. */
export const DEACTIVATE_PET_SQL = `UPDATE pets SET is_active = 0 WHERE id = ?`;

/**
 * Parâmetros: id. O trigger trg_pet_activate_owner reativa o dono, se estiver inativo, e o
 * PackageScheduleService refaz a agenda se o pacote estiver ligado.
 */
export const ACTIVATE_PET_SQL = `UPDATE pets SET is_active = 1 WHERE id = ?`;

/** Parâmetros: id. As colunas do pet que a remarcação lê (PetPackage, em domain/packageSchedule.ts). */
export const FIND_PET_PACKAGE_SQL = `SELECT reschedule_active, package_frequency, package_start_date, package_price,
  default_time, default_service_id, is_active, last_auto_visit_date
  FROM pets WHERE id = ?`;

/** Parâmetros: id, id. Aponta o pet para o último automático em aberto, ou nulo se não houver. */
export const REFRESH_LAST_AUTO_VISIT_SQL = `UPDATE pets
  SET last_auto_visit_date = (
    SELECT MAX(date) FROM appointments
    WHERE pet_id = ? AND is_auto = 1 AND completed = 0
  )
  WHERE id = ?`;
