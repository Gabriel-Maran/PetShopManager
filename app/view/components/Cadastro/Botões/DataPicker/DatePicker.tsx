import { useCallback, useState } from "react";
import { DatePickerInput } from "./DatePickerInput";
import { DatePickerModal } from "./DatePickerModal";

//EX:
/*
<DatePicker
  label="Data do agendamento"
  value={data}
  onChange={setData}
  minDate="2024-01-01"
  error={erro}
/>
*/

interface DatePickerProps {
  isEditavel: boolean;
  withIcon?: boolean;
  value?: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  error?: string;
  modalTitle?: string;
}

export function DatePicker({
  isEditavel = true,
  withIcon = true,
  value,
  onChange,
  label,
  placeholder,
  minDate,
  maxDate,
  error,
  modalTitle,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  // Seleção temporária dentro do modal (só aplica ao confirmar)
  const [temp, setTemp] = useState<string | undefined>(value);

  const handleOpen = useCallback(() => {
    if (isEditavel) {
      setTemp(value); // reseta para o valor atual ao abrir
      setOpen(true);
    }
  }, [value]);

  const handleClose = useCallback(() => setOpen(false), []);

  const handleConfirm = useCallback(
    (date: string) => {
      onChange(date);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <>
      <DatePickerInput
        withIcon={withIcon}
        value={value}
        label={label}
        placeholder={placeholder}
        error={error}
        onPress={handleOpen}
        isEditavel={!isEditavel}
      />

      <DatePickerModal
        visible={open}
        value={temp}
        onChange={setTemp}
        onClose={handleClose}
        onConfirm={handleConfirm}
        minDate={minDate}
        maxDate={maxDate}
        title={modalTitle ?? label}
      />
    </>
  );
}
