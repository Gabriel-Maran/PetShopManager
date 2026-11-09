import { DependencyList, useCallback, useEffect, useState } from "react";
import { useError } from "./useError";
import type { Page } from "../model/Search";

const EMPTY_PAGE: Page<never> = { items: [], total: 0 };

interface SearchPage<T> extends Page<T> {
  /** Busca de novo a mesma página, depois de uma ação que muda a lista. */
  reload: () => void;
}

/**
 * Carrega uma página da busca, com o total do mesmo filtro, quando `deps` muda e `enabled` está
 * ligado. Só a busca mais recente chega à tela: se o usuário troca de aba ou de página antes de a
 * anterior terminar, a resposta antiga é descartada. Uma falha aparece pelo ErrorProvider.
 */
export function useSearchPage<T>(
  load: () => Promise<Page<T>>,
  deps: DependencyList,
  enabled: boolean = true,
): SearchPage<T> {
  const { showError } = useError();
  const [page, setPage] = useState<Page<T>>(EMPTY_PAGE);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let isLatest = true;
    load()
      .then((result) => {
        if (isLatest) setPage(result);
      })
      .catch((error: unknown) => {
        if (isLatest) showError(error);
      });
    return () => {
      isLatest = false;
    };
    // O `load` é recriado a cada render; quem decide quando buscar de novo é o `deps`.
  }, [...deps, enabled, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return { ...page, reload };
}
