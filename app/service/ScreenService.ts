import { Screen } from "../config/consts";

class ScreenService {
  private currentScreen: Screen = Screen.Calendario;
  private currentParams: unknown = undefined;

  getScreen(): Screen {
    return this.currentScreen;
  }

  getParams(): unknown {
    return this.currentParams;
  }

  set(screen: Screen, params?: unknown): void {
    this.currentScreen = screen;
    this.currentParams = params;
  }
}

export const screenService = new ScreenService();
