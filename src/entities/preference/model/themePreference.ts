import * as v from 'valibot';

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;

export const ThemePreferenceSchema = v.picklist(THEME_PREFERENCES);

export type ThemePreference = v.InferOutput<typeof ThemePreferenceSchema>;

export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export const isThemePreference = (value: unknown): value is ThemePreference =>
  v.is(ThemePreferenceSchema, value);

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';
