import { backRouteOf, HOME_SCREEN, Screen } from "../config/navigation.ts";

type Listener = (screen: Screen, params?: unknown) => void;

/** Assume o voltar no lugar da navegação, como a confirmação antes de sair de um formulário. */
type BackGuard = () => void;

export class ScreenController {
  private currentScreen: Screen = HOME_SCREEN;
  private currentParams: unknown = undefined;
  private listeners: Listener[] = [];
  private backGuard: BackGuard | null = null;

  getCurrentScreen() {
    return this.currentScreen;
  }

  getCurrentParams() {
    return this.currentParams;
  }

  setCurrentScreen(screen: Screen, params?: unknown) {
    this.currentScreen = screen;
    this.currentParams = params;
    this.listeners.forEach((l) => l(screen, params));
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * O voltar dos dois botões, o da tela e o do Android. Devolve false só quando não há para onde
   * voltar: aí o Android fecha o app.
   */
  requestBack(): boolean {
    if (this.backGuard) {
      this.backGuard();
      return true;
    }
    return this.goBack();
  }

  /** Volta sem passar pela guarda, como depois de o usuário confirmar a saída. */
  goBack(): boolean {
    const route = backRouteOf(this.currentScreen);
    if (!route) return false;
    this.setCurrentScreen(route.screen, route.params);
    return true;
  }

  /** Põe a guarda do voltar da tela aberta e devolve a função que a tira. */
  setBackGuard(guard: BackGuard) {
    this.backGuard = guard;
    return () => {
      // Só tira a própria guarda, para não apagar a que outra tela já tenha posto.
      if (this.backGuard === guard) this.backGuard = null;
    };
  }
}

export const screenController = new ScreenController();
