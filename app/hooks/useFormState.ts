import { useState } from "react";

export default function useFormState<T extends object>(initialState: T) {
  const [form, setForm] = useState<T>(initialState);

  function updateField<K extends keyof T>(field: K, value: T[K]) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  return { form, updateField };
}
