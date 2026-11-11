import { useEffect, useState } from "react";
import { useError } from "./useError";

interface AsyncData<T> {
  /** O resultado do `load`, ou null enquanto carrega e depois de uma falha. */
  data: T | null;
  loading: boolean;
}

/**
 * Carrega os dados de uma tela ao abrir. Uma falha aparece pelo ErrorProvider uma vez só, e a tela
 * mostra o estado vazio com `data` null.
 */
export function useAsyncData<T>(load: () => Promise<T>): AsyncData<T> {
  const { showError } = useError();
  const [state, setState] = useState<AsyncData<T>>({ data: null, loading: true });

  useEffect(() => {
    let active = true;
    load()
      .then((data) => {
        if (active) setState({ data, loading: false });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ data: null, loading: false });
        showError(error);
      });
    return () => {
      active = false;
    };
    // Carrega uma vez, ao abrir a tela: o `load` é recriado a cada render, e o showError é estável.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
