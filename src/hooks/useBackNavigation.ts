import { useCallback } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

/**
 * Enquanto a tela estiver em foco, a guarda assume o voltar do Android, como a confirmação antes de
 * sair de um formulário mudado. Com null, o voltar segue com o React Navigation. O listener da tela
 * roda antes do da navegação, que foi posto primeiro. A guarda precisa ser estável (useCallback).
 */
export function useBackGuard(guard: (() => void) | null) {
  useFocusEffect(
    useCallback(() => {
      if (!guard) return;
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        guard();
        return true;
      });
      return () => subscription.remove();
    }, [guard]),
  );
}
