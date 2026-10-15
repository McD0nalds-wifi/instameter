import type { ThemePreference } from './themePreference';

import { atom } from 'jotai';

import { DEFAULT_THEME_PREFERENCE } from './themePreference';
import { writeSetting } from '../api/settingsRepository';

import { appDbAtom } from '@/shared/api';

export const themePreferenceAtom = atom<ThemePreference>(DEFAULT_THEME_PREFERENCE);

export const saveThemePreferenceAtom = atom(null, async (get, set, preference: ThemePreference) => {
  const db = get(appDbAtom);

  if (db) {
    await writeSetting(db, 'themePreference', preference);
  }
  set(themePreferenceAtom, preference);
});
