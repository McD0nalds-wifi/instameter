type StandaloneNavigator = Navigator & { standalone?: boolean };

export const isStandalone = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as StandaloneNavigator).standalone === true;
