import type { ThemePreference } from '../model/themePreference';
import type { AppDb } from '@/shared/api';

import { readSetting } from './settingsRepository';
import { DEFAULT_DEVICE_CORRECTION, DeviceCorrectionSchema } from '../model/deviceCorrection';
import { DEFAULT_THEME_PREFERENCE, ThemePreferenceSchema } from '../model/themePreference';

export type AppSettings = {
  themePreference: ThemePreference;
  deviceCorrection: number;
};

export const loadAppSettings = async (db: AppDb): Promise<AppSettings> => {
  const [themePreference, deviceCorrection] = await Promise.all([
    readSetting(db, 'themePreference', ThemePreferenceSchema),
    readSetting(db, 'deviceCorrection', DeviceCorrectionSchema),
  ]);
  return {
    themePreference: themePreference ?? DEFAULT_THEME_PREFERENCE,
    deviceCorrection: deviceCorrection ?? DEFAULT_DEVICE_CORRECTION,
  };
};
