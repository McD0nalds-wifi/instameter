import type { FC, ReactNode } from 'react';

import { BottomNavigation } from './bottomNavigation/BottomNavigation';
import { StorageBanner } from './storageBanner/StorageBanner';
import { UpdateBanner } from './updateBanner/UpdateBanner';

type AppShellProps = {
  children: ReactNode;
};

export const AppShell: FC<AppShellProps> = ({ children }) => (
  <div className="min-h-dvh pt-safe">
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 pt-6 pb-24">
      <StorageBanner />
      <UpdateBanner />
      {children}
    </main>
    <BottomNavigation />
  </div>
);
