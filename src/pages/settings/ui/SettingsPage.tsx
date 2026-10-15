import type { FC } from 'react';

import { Heading } from '@heroui/react';

import { ThemeSwitcher } from '@/features/switchTheme';
import { strings } from '@/shared/config';

export const SettingsPage: FC = () => (
  <section className="flex flex-col gap-6">
    <Heading level={1}>{strings.settingsPage.title}</Heading>
    <ThemeSwitcher />
  </section>
);
