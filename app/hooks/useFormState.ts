import { useCallback, useState } from "react";
import { isFormDirty } from "../utils/formDirty";

/** Troca um campo do formulário, com o valor no tipo daquele campo. */
export type UpdateField<T> = <K extends keyof T>(field: K, value: T[K]) => void;

type FormStateOptions<T> = {
  /** Campos que não contam como mudança do usuário, como os nomes buscados a partir de um id. */
  ignoredWhenComparing?: readonly (keyof T)[];
};

export default function useFormState<T extends object>(
  initialState: T,
  { ignoredWhenComparing }: FormStateOptions<T> = {},
) {
  // O estado com que a tela abriu, guardado no primeiro render para comparar depois.
  const [initialForm] = useState<T>(initialState);
  const [form, setForm] = useState<T>(initialState);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const isDirty = isFormDirty(initialForm, form, ignoredWhenComparing);

  return { form, updateField, isDirty };
}
