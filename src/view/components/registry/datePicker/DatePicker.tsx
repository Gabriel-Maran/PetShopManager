import { useCallback, useState } from "react";
import { DatePickerInput } from "./DatePickerInput";
import { DatePickerModal } from "./DatePickerModal";

interface DatePickerProps {
  isEditable: boolean;
  withIcon?: boolean;
  value?: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  /** Nome do campo para o leitor de tela, quando o rótulo visível fica fora do componente. */
  accessibilityName?: string;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  error?: string;
  modalTitle?: string;
}

export function DatePicker({
  isEditable = true,
  withIcon = true,
  value,
  onChange,
  label,
  accessibilityName,
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
    if (isEditable) {
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
        accessibilityName={accessibilityName}
        placeholder={placeholder}
        error={error}
        onPress={handleOpen}
        isEditable={!isEditable}
      />

      <DatePickerModal
        visible={open}
        value={temp}
        onChange={setTemp}
        onClose={handleClose}
        onConfirm={handleConfirm}
        minDate={minDate}
        maxDate={maxDate}
        title={modalTitle || label || accessibilityName}
      />
    </>
  );
}
