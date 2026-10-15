import type { FC } from 'react';

import { Redirect, Route, Switch } from 'wouter';

import { CatalogPage } from '@/pages/catalog';
import { MeasurePage } from '@/pages/measure';
import { MyCamerasPage } from '@/pages/myCameras';
import { SettingsPage } from '@/pages/settings';
import { paths } from '@/shared/config';

export const AppRoutes: FC = () => (
  <Switch>
    <Route path={paths.measure} component={MeasurePage} />
    <Route path={paths.catalog} component={CatalogPage} />
    <Route path={paths.myCameras} component={MyCamerasPage} />
    <Route path={paths.settings} component={SettingsPage} />
    <Route>
      <Redirect to={paths.measure} replace />
    </Route>
  </Switch>
);
