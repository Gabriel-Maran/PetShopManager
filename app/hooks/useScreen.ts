import { useEffect, useState } from "react";
import { screenController } from "../controller/ScreenController";
import { Screen } from "../config/consts";

export function useScreen<T = unknown>() {
  const [screen, setScreen] = useState(screenController.getCurrentScreen());
  const [params, setParams] = useState<T | undefined>(
    screenController.getCurrentParams() as T | undefined,
  );

  useEffect(() => {
    const unsubscribe = screenController.subscribe((s, p) => {
      setScreen(s);
      setParams(p as T | undefined);
    });
    return unsubscribe;
  }, []);

  return {
    screen,
    params,
    navigate: (s: Screen, p?: unknown) =>
      screenController.setCurrentScreen(s, p),
  };
}
