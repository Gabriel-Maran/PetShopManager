// SQL das raças e das espécies, sem depender do Expo: os repositories e os testes executam os mesmos
// comandos.
import { toSearchPattern, type SqlQuery } from "./searchSql.ts";

/** Parâmetros: species_id, name, normalized_name. */
export const INSERT_BREED_SQL = `INSERT INTO breeds (species_id, name, normalized_name) VALUES (?, ?, ?)`;

/** Parâmetros: id. Devolve a linha só se a espécie existe. */
export const FIND_SPECIES_SQL = `SELECT id FROM species WHERE id = ?`;

/** Parâmetros: id. A raça com a espécie dela. */
export const FIND_BREED_SQL = `SELECT id, species_id, name FROM breeds WHERE id = ?`;

/**
 * Parâmetros: species_id. Os nomes das raças da espécie, para achar a repetida pelo nome normalizado no
 * código: o `normalized_name` da carga inicial tira também a pontuação ("vira-lata srd"), e o do
 * app não, então comparar a coluna deixaria passar "vira-lata (srd)".
 */
export const LIST_BREED_NAMES_SQL = `SELECT name FROM breeds WHERE species_id = ?`;

/**
 * O filtro da busca, o mesmo na página e na contagem. O texto vira o padrão do LIKE com `%`, `_` e `\`
 * escapados, como na busca de donos e pets; vazio, o padrão `%%` traz todas as raças da espécie.
 */
function breedFilter(speciesId: number, query: string): SqlQuery {
  return {
    sql: `WHERE species_id = ? AND normalized_name LIKE ? ESCAPE '\\'`,
    params: [speciesId, toSearchPattern(query)],
  };
}

/** Uma página das raças da espécie, de A a Z. O id desempata, para nenhuma raça repetir entre páginas. */
export function listBreedsSql(
  speciesId: number,
  query: string,
  page: number,
  limit: number,
): SqlQuery {
  const filter = breedFilter(speciesId, query);
  return {
    sql: `SELECT id, name FROM breeds ${filter.sql}
       ORDER BY name ASC, id ASC
       LIMIT ? OFFSET ?`,
    params: [...filter.params, limit, page * limit],
  };
}

/** O total de raças da mesma busca, para a paginação. */
export function countBreedsSql(speciesId: number, query: string): SqlQuery {
  const filter = breedFilter(speciesId, query);
  return {
    sql: `SELECT COUNT(*) AS total FROM breeds ${filter.sql}`,
    params: filter.params,
  };
}
