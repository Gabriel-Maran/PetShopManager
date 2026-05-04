import { Screen } from "../config/consts";

type Listener = (screen: Screen, params?: unknown) => void;

class ScreenController {
  private currentScreen: Screen = Screen.Calendario;
  private currentParams: unknown = undefined;
  private listeners: Listener[] = [];

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
}

export const screenController = new ScreenController();
