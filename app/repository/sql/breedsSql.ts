// SQL da busca de raças no seletor do pet, sem depender do Expo: o SpeciesRepository e os testes
// executam os mesmos comandos.
import { toSearchPattern, type SqlQuery } from "./searchSql.ts";

/** Parâmetros: especie_id, nome_raca, nome_raca_normalized. */
export const INSERT_BREED_SQL = `INSERT INTO race (especie_id, nome_raca, nome_raca_normalized) VALUES (?, ?, ?)`;

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
