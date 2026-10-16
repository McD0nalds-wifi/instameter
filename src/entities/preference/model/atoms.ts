import type { ThemePreference } from './themePreference';

import { atom } from 'jotai';

import { DEFAULT_DEVICE_CORRECTION } from './deviceCorrection';
import { DEFAULT_THEME_PREFERENCE } from './themePreference';

import { appDbAtom, writeSetting } from '@/shared/api';

export const themePreferenceAtom = atom<ThemePreference>(DEFAULT_THEME_PREFERENCE);

export const saveThemePreferenceAtom = atom(null, async (get, set, preference: ThemePreference) => {
  const db = get(appDbAtom);

  if (db) {
    await writeSetting(db, 'themePreference', preference);
  }
  set(themePreferenceAtom, preference);
});

export const deviceCorrectionAtom = atom<number>(DEFAULT_DEVICE_CORRECTION);

export const saveDeviceCorrectionAtom = atom(null, async (get, set, correction: number) => {
  const db = get(appDbAtom);

  if (db) {
    await writeSetting(db, 'deviceCorrection', correction);
  }
  set(deviceCorrectionAtom, correction);
});

export const installHintDismissedAtom = atom(false);

export const dismissInstallHintAtom = atom(null, async (get, set) => {
  const db = get(appDbAtom);

  if (db) {
    await writeSetting(db, 'installHintDismissed', true);
  }
  set(installHintDismissedAtom, true);
});
