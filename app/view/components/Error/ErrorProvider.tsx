import React, { createContext, useCallback, useMemo, useState } from "react";
import { logError, toUserMessage } from "../../../errors/AppError";
import ErrorModal from "./ErrorModal";

interface ErrorContextType {
  /**
   * Mostra o erro no modal: a mensagem do AppError, ou a genérica para qualquer outro erro, que vai
   * inteiro para o log. Recebe o erro como veio, sem a tela montar o texto.
   */
  showError: (error: unknown) => void;
}

export const ErrorContext = createContext<ErrorContextType>({
  showError: () => {},
});

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const showError = useCallback((error: unknown) => {
    logError(error);
    setMessage(toUserMessage(error));
  }, []);

  // O valor estável evita refazer as telas que só usam o showError a cada erro mostrado.
  const value = useMemo(() => ({ showError }), [showError]);

  return (
    <ErrorContext.Provider value={value}>
      {children}
      <ErrorModal message={message} onClose={() => setMessage(null)} />
    </ErrorContext.Provider>
  );
}
