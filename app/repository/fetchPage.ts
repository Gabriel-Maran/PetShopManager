import { getDatabase } from "../config/database";
import type { Page } from "../model/Search";
import type { PagedSql } from "./sql/searchSql";

/** Roda a página e a contagem de uma busca, que usam o mesmo filtro. */
export async function fetchPage<T>({ list, count }: PagedSql): Promise<Page<T>> {
  const db = await getDatabase();
  const items = await db.getAllAsync<T>(list.sql, list.params);
  const counted = await db.getFirstAsync<{ total: number }>(count.sql, count.params);
  return { items, total: counted?.total ?? 0 };
}
