// controller/ScreenController.ts
import { Screen } from "../config/consts";
import { screenService } from "../service/ScreenService";

type Listener = (screen: Screen) => void;

class ScreenController {
  private listeners: Set<Listener> = new Set();

  getCurrentScreen(): Screen {
    return screenService.get();
  }

  setCurrentScreen(screen: Screen): void {
    screenService.set(screen);
    this.listeners.forEach((listener) => listener(screen));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const screenController = new ScreenController();
