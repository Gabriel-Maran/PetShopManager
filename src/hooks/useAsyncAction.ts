import { useRef, useState } from "react";
import { useError } from "./useError";

/**
 * Roda uma ação da tela (salvar, importar, carregar) com o carregamento ligado. Um segundo toque não
 * começa outra enquanto a primeira não termina, e uma falha aparece pelo ErrorProvider. O `run`
 * devolve se a ação deu certo.
 */
export function useAsyncAction<Args extends unknown[]>(
  action: (...args: Args) => Promise<void>,
): { run: (...args: Args) => Promise<boolean>; isRunning: boolean } {
  const { showError } = useError();
  const [isRunning, setIsRunning] = useState(false);
  // O estado só muda no próximo render; a ref barra o toque duplo no mesmo instante.
  const runningRef = useRef(false);

  async function run(...args: Args): Promise<boolean> {
    if (runningRef.current) return false;
    runningRef.current = true;
    setIsRunning(true);
    try {
      await action(...args);
      return true;
    } catch (error) {
      showError(error);
      return false;
    } finally {
      runningRef.current = false;
      setIsRunning(false);
    }
  }

  return { run, isRunning };
}
