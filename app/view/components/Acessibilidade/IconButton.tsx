import { TouchableOpacity, TouchableOpacityProps } from "react-native";
import { touchTargetSlop } from "./accessibilityProps";

type IconButtonProps = Omit<
  TouchableOpacityProps,
  "accessibilityLabel" | "accessibilityRole" | "hitSlop"
> & {
  /** O que o leitor de tela fala, já que o botão não tem texto. */
  label: string;
  /** Largura do botão na tela, para completar a área de toque até 48 dp. */
  width: number;
  /** Altura do botão na tela; sem ela, o botão é quadrado. */
  height?: number;
};

/** Botão só com ícone: papel de botão, nome para o leitor de tela e área de toque de 48 dp. */
export default function IconButton({
  label,
  width,
  height = width,
  children,
  ...touchableProps
}: IconButtonProps) {
  return (
    <TouchableOpacity
      {...touchableProps}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={touchTargetSlop({ width, height })}
    >
      {children}
    </TouchableOpacity>
  );
}
