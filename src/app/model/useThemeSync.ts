import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

import { applyTheme, DARK_SCHEME_QUERY } from './theme';

import { resolveTheme, themePreferenceAtom } from '@/entities/preference';

export const useThemeSync = () => {
  const preference = useAtomValue(themePreferenceAtom);

  useEffect(() => {
    const media = window.matchMedia(DARK_SCHEME_QUERY);
    const syncTheme = () => applyTheme(resolveTheme(preference, media.matches));

    syncTheme();
    media.addEventListener('change', syncTheme);
    return () => media.removeEventListener('change', syncTheme);
  }, [preference]);
};
