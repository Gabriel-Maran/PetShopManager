import { useState } from "react"

export default function useFormState<T extends object>(initialState: T){
    const [form, setForm] = useState<T>(initialState)

    function updateField<K extends keyof T>(field: K, value: T[K]) {
        setForm((prev) => ({
            ...prev,
            [field]: value
        }))
    }

    function resetForm() {
        setForm(initialState)
    }

    function setAllFields(values: Partial<T>){
        setForm((prev) => ({
            ...prev,
            ...values
        }))
    }

    return{
        form,
        setForm,
        updateField,
        resetForm,
        setAllFields,
    }

}