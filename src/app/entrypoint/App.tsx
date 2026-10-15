import type { AppStore } from '../model/bootstrap';
import type { FC } from 'react';

import { Provider } from 'jotai';
import { Router } from 'wouter';

import { useThemeSync } from '../model/useThemeSync';
import { AppRoutes } from '../routes/AppRoutes';

import { routerBase } from '@/shared/config';
import { AppShell } from '@/widgets/appShell';

type AppProps = {
  store: AppStore;
};

const ThemedApp: FC = () => {
  useThemeSync();

  return (
    <Router base={routerBase}>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </Router>
  );
};

export const App: FC<AppProps> = ({ store }) => (
  <Provider store={store}>
    <ThemedApp />
  </Provider>
);
