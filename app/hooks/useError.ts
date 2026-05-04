import { useContext } from "react";
import { ErrorContext } from "../view/components/Error/ErrorProvider";

export function useError() {
  return useContext(ErrorContext);
}
