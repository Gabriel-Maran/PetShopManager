import { useEffect } from "react";
import { BackHandler } from "react-native";
import { screenController } from "../controller/ScreenController";

/**
 * Liga o botão voltar do Android ao mesmo voltar do botão da tela (BUG-8). Fica na raiz do app: um
 * listener só para todas as telas, tirado quando a raiz sai.
 */
export function useAndroidBackButton() {
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () =>
      screenController.requestBack(),
    );
    return () => subscription.remove();
  }, []);
}

/**
 * Enquanto a tela estiver aberta, a guarda assume o voltar dos dois botões. Com null, o voltar segue
 * direto. A guarda precisa ser estável (useCallback), para não ser trocada a cada render.
 */
export function useBackGuard(guard: (() => void) | null) {
  useEffect(() => {
    if (!guard) return;
    return screenController.setBackGuard(guard);
  }, [guard]);
}
