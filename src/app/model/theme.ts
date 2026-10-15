import type { ResolvedTheme } from '@/entities/preference';

export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export const applyTheme = (theme: ResolvedTheme) => {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
};
