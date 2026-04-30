// hooks/useScreen.ts
import { useEffect, useState } from "react";
import { screenController } from "../controller/ScreenController";
import { Screen } from "../config/consts";

export function useScreen() {
  const [screen, setScreen] = useState(screenController.getCurrentScreen());

  useEffect(() => {
    const unsubscribe = screenController.subscribe(setScreen);
    return unsubscribe;
  }, []);

  return {
    screen,
    navigate: (s: Screen) => screenController.setCurrentScreen(s),
  };
}
