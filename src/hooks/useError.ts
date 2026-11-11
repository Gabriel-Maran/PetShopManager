import { useContext } from "react";
import { ErrorContext } from "../view/components/error/ErrorProvider";

export function useError() {
  return useContext(ErrorContext);
}
