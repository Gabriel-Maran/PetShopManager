import { useCallback } from "react";
import {
  CommonActions,
  StackActions,
  useNavigation,
  useRoute,
  type NavigationState,
  type PartialState,
} from "@react-navigation/native";
import { HOME_SCREEN, planNavigation, type Screen } from "../config/navigation";

/** A parte da navegação que o plano usa: a do useNavigation e a do navigationRef do App. */
interface Navigator {
  getState(): NavigationState | undefined;
  dispatch(
    action: ReturnType<typeof CommonActions.reset> | ReturnType<typeof StackActions.push>,
  ): void;
}

/** Abre a tela pela regra de `planNavigation`. */
export function navigateTo(navigator: Navigator, screen: Screen, params?: object) {
  const plan = planNavigation(screen);
  if (plan.kind === "push") {
    navigator.dispatch(StackActions.push(plan.target, params));
    return;
  }
  // O Calendário de baixo é o mesmo (mesma chave), para não recarregar à toa; a aba abre de novo.
  const home = navigator.getState()?.routes.find((route) => route.name === HOME_SCREEN);
  const routes: PartialState<NavigationState>["routes"] = [
    home ? { key: home.key, name: home.name, params: home.params } : { name: HOME_SCREEN },
  ];
  if (plan.target) routes.push({ name: plan.target, params });
  navigator.dispatch(CommonActions.reset({ index: routes.length - 1, routes }));
}

/** A tela aberta, os parâmetros dela e a navegação. */
export function useScreen<T = unknown>() {
  const navigation = useNavigation();
  const route = useRoute();

  const navigate = useCallback(
    (screen: Screen, params?: object) => navigateTo(navigation, screen, params),
    [navigation],
  );
  const goBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  return { screen: route.name as Screen, params: route.params as T | undefined, navigate, goBack };
}
