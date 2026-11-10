import { useEffect, useState } from "react";
import { screenController } from "../controller/ScreenController";
import { Screen } from "../config/consts";

const navigate = (screen: Screen, params?: unknown) =>
  screenController.setCurrentScreen(screen, params);
const requestBack = () => screenController.requestBack();
const goBack = () => screenController.goBack();

export function useScreen<T = unknown>() {
  const [screen, setScreen] = useState(screenController.getCurrentScreen());
  const [params, setParams] = useState<T | undefined>(
    screenController.getCurrentParams() as T | undefined,
  );

  useEffect(() => {
    const unsubscribe = screenController.subscribe((s, p) => {
      setScreen(s);
      setParams(p !== undefined ? (p as T) : undefined);
    });
    return unsubscribe;
  }, []);

  return { screen, params, navigate, requestBack, goBack };
}
