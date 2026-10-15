import { createStore } from 'jotai';

import { loadAppSettings } from '../api/loadAppSettings';
import { writeSetting } from '../api/settingsRepository';
import { resolveTheme } from '../lib/resolveTheme';
import { saveThemePreferenceAtom, themePreferenceAtom } from '../model/atoms';

import { appDbAtom, openAppDb } from '@/shared/api';

const openFreshDb = () => openAppDb(crypto.randomUUID());

describe('resolveTheme', () => {
  it('явный выбор пользователя важнее системной настройки', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('режим system следует системной настройке', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
});

describe('loadAppSettings', () => {
  it('без сохранённых настроек отдаёт значения по умолчанию', async () => {
    const db = await openFreshDb();

    await expect(loadAppSettings(db)).resolves.toEqual({ themePreference: 'system' });
    db.close();
  });

  it('пропускает запись, не прошедшую схему', async () => {
    const db = await openFreshDb();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await writeSetting(db, 'themePreference', 'sepia');

    await expect(loadAppSettings(db)).resolves.toEqual({ themePreference: 'system' });
    expect(warn).toHaveBeenCalledOnce();

    warn.mockRestore();
    db.close();
  });
});

describe('saveThemePreferenceAtom', () => {
  it('сначала пишет в базу, затем обновляет атом', async () => {
    const db = await openFreshDb();
    const store = createStore();
    store.set(appDbAtom, db);

    await store.set(saveThemePreferenceAtom, 'dark');

    expect(store.get(themePreferenceAtom)).toBe('dark');
    await expect(loadAppSettings(db)).resolves.toEqual({ themePreference: 'dark' });
    db.close();
  });

  it('без базы обновляет только атом', async () => {
    const store = createStore();

    await store.set(saveThemePreferenceAtom, 'light');

    expect(store.get(themePreferenceAtom)).toBe('light');
  });
});
