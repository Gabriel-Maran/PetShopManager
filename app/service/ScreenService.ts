// service/ScreenService.ts
import { Screen } from "../config/consts";

class ScreenService {
  private currentScreen: Screen = Screen.Calendario;

  get(): Screen {
    return this.currentScreen;
  }

  set(screen: Screen): void {
    this.currentScreen = screen;
  }
}

export const screenService = new ScreenService();
