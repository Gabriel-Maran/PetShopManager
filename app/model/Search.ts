/**
 * Uma busca por nome, como a de Cadastros e a dos seletores de dono e de pet. Sem texto, a lista sai
 * com os mais novos primeiro; com texto, em ordem alfabética.
 */
export interface NameSearch {
  /** O texto digitado. Vazio lista todos. */
  query: string;
  /** 1 lista os ativos; 0, os inativos. */
  ativo: number;
  /** A página, a partir de 0. */
  page: number;
  /** Quantos itens cabem numa página. */
  limit: number;
}

/** Uma página da busca e o total com o mesmo filtro, para a paginação bater com a lista. */
export interface Page<T> {
  items: T[];
  total: number;
}
