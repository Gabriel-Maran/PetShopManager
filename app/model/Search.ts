import type { ORDER } from "../config/consts";

/** Uma busca por nome, como a de Cadastros e a dos seletores de dono e de pet. */
export interface NameSearch {
  /** O texto digitado. Vazio lista todos, pela data de cadastro. */
  query: string;
  /** 1 lista os ativos; 0, os inativos. */
  ativo: number;
  /** A página, a partir de 0. */
  page: number;
  /** Quantos itens cabem numa página. */
  limit: number;
  order: ORDER;
}

/** Uma página da busca e o total com o mesmo filtro, para a paginação bater com a lista. */
export interface Page<T> {
  items: T[];
  total: number;
}
