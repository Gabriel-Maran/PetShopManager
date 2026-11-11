// Busca paginada por nome (BUG-5): a lista e a contagem saem da mesma função, com o mesmo FROM e o
// mesmo filtro, para o total da paginação bater com o que a lista mostra. Sem depender do Expo, para
// os testes rodarem o mesmo SQL no Node.
import { normalizeForSearch } from "../../utils/formatters/normalizeForSearch.ts";
import type { NameSearch } from "../../model/Search";

/** Um comando e os parâmetros dele, na ordem dos `?`. */
export interface SqlQuery {
  sql: string;
  params: (string | number)[];
}

/** O comando da página e o da contagem de uma mesma busca. */
export interface PagedSql {
  list: SqlQuery;
  count: SqlQuery;
}

/** De onde a busca lê: as colunas da lista, o FROM com os JOINs e o apelido da tabela buscada. */
export interface SearchSource {
  columns: string;
  from: string;
  alias: string;
}

/**
 * O texto da busca vira o padrão do LIKE: sem acento, em minúsculas e com `%`, `_` e `\` escapados,
 * para o usuário buscar esses caracteres como texto, e não como coringa.
 */
export function toSearchPattern(query: string): string {
  const escaped = normalizeForSearch(query).replace(/[\\%_]/g, (char) => `\\${char}`);
  return `%${escaped}%`;
}

/**
 * A página e o total da busca. Sem texto, os mais novos vêm primeiro; com texto, a ordem é alfabética.
 * O id desempata, para a mesma linha não aparecer em duas páginas.
 */
export function pagedNameSearch(source: SearchSource, search: NameSearch): PagedSql {
  const { columns, from, alias } = source;
  const where = `WHERE ${alias}.is_active = ? AND ${alias}.normalized_name LIKE ? ESCAPE '\\'`;
  const filterParams = [search.active, toSearchPattern(search.query)];
  const orderBy = normalizeForSearch(search.query)
    ? `${alias}.normalized_name ASC, ${alias}.id ASC`
    : `${alias}.created_at DESC, ${alias}.id DESC`;

  return {
    list: {
      sql: `SELECT ${columns} ${from} ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      params: [...filterParams, search.limit, search.page * search.limit],
    },
    count: {
      sql: `SELECT COUNT(*) AS total ${from} ${where}`,
      params: filterParams,
    },
  };
}
