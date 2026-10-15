import type { ResolvedTheme, ThemePreference } from '../model/themePreference';

export const resolveTheme = (
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme => {
  if (preference !== 'system') {
    return preference;
  }
  return systemPrefersDark ? 'dark' : 'light';
};
