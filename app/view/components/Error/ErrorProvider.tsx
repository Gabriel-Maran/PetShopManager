// context/ErrorContext.tsx
import React, { createContext, useState } from "react";
import ErrorModal from "./ErrorModal";

interface ErrorContextType {
  showError: (message: string) => void;
}

export const ErrorContext = createContext<ErrorContextType>({
  showError: () => {},
});

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <ErrorContext.Provider value={{ showError: setMessage }}>
      {children}
      <ErrorModal message={message} onClose={() => setMessage(null)} />
    </ErrorContext.Provider>
  );
}
