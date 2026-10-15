import type { ThemePreference } from '../model/themePreference';
import type { AppDb } from '@/shared/api';

import { readSetting } from './settingsRepository';
import { DEFAULT_THEME_PREFERENCE, ThemePreferenceSchema } from '../model/themePreference';

export type AppSettings = {
  themePreference: ThemePreference;
};

export const loadAppSettings = async (db: AppDb): Promise<AppSettings> => {
  const themePreference = await readSetting(db, 'themePreference', ThemePreferenceSchema);
  return { themePreference: themePreference ?? DEFAULT_THEME_PREFERENCE };
};
