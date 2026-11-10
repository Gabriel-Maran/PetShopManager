// SQL das raças e das espécies, sem depender do Expo: os repositories e os testes executam os mesmos
// comandos.
import { toSearchPattern, type SqlQuery } from "./searchSql.ts";

/** Parâmetros: especie_id, nome_raca, nome_raca_normalized. */
export const INSERT_BREED_SQL = `INSERT INTO race (especie_id, nome_raca, nome_raca_normalized) VALUES (?, ?, ?)`;

/** Parâmetros: id. Devolve a linha só se a espécie existe. */
export const FIND_SPECIES_SQL = `SELECT id FROM species WHERE id = ?`;

/** Parâmetros: id. A raça com a espécie dela. */
export const FIND_BREED_SQL = `SELECT id, especie_id, nome_raca FROM race WHERE id = ?`;

/**
 * Parâmetros: especie_id. Os nomes das raças da espécie, para achar a repetida pelo nome normalizado no
 * código: o `nome_raca_normalized` da carga inicial tira também a pontuação ("vira-lata srd"), e o do
 * app não, então comparar a coluna deixaria passar "vira-lata (srd)".
 */
export const LIST_BREED_NAMES_SQL = `SELECT nome_raca FROM race WHERE especie_id = ?`;

/**
 * O filtro da busca, o mesmo na página e na contagem. O texto vira o padrão do LIKE com `%`, `_` e `\`
 * escapados, como na busca de donos e pets; vazio, o padrão `%%` traz todas as raças da espécie.
 */
function breedFilter(speciesId: number, query: string): SqlQuery {
  return {
    sql: `WHERE especie_id = ? AND nome_raca_normalized LIKE ? ESCAPE '\\'`,
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
    sql: `SELECT id, nome_raca AS nome FROM race ${filter.sql}
       ORDER BY nome_raca ASC, id ASC
       LIMIT ? OFFSET ?`,
    params: [...filter.params, limit, page * limit],
  };
}

/** O total de raças da mesma busca, para a paginação. */
export function countBreedsSql(speciesId: number, query: string): SqlQuery {
  const filter = breedFilter(speciesId, query);
  return {
    sql: `SELECT COUNT(*) AS total FROM race ${filter.sql}`,
    params: filter.params,
  };
}
