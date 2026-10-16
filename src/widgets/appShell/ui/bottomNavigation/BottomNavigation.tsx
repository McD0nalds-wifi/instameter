import type { FC } from 'react';

import { Typography } from '@heroui/react';
import { Aperture, BookOpen, Camera, Settings } from 'lucide-react';
import { Link, useLocation } from 'wouter';

import { paths, strings } from '@/shared/config';

const items = [
  { href: paths.measure, label: strings.navigation.measure, Icon: Aperture },
  { href: paths.catalog, label: strings.navigation.catalog, Icon: BookOpen },
  { href: paths.myCameras, label: strings.navigation.myCameras, Icon: Camera },
  { href: paths.settings, label: strings.navigation.settings, Icon: Settings },
] as const;

const linkClassName = (isActive: boolean) =>
  isActive
    ? 'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-accent'
    : 'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-muted';

export const BottomNavigation: FC = () => {
  const [location] = useLocation();

  return (
    <nav
      aria-label={strings.navigation.label}
      className="fixed inset-x-0 bottom-0 border-t border-separator bg-background pb-safe"
    >
      <ul className="mx-auto flex max-w-xl">
        {items.map(({ href, label, Icon }) => {
          const isActive = location === href;
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                className={linkClassName(isActive)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon aria-hidden size={22} strokeWidth={isActive ? 2.5 : 2} />
                <Typography type="body-xs" weight={isActive ? 'semibold' : 'normal'}>
                  {label}
                </Typography>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
