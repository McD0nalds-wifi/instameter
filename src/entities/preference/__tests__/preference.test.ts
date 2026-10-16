import { createStore } from 'jotai';

import { loadAppSettings } from '../api/loadAppSettings';
import { resolveTheme } from '../lib/resolveTheme';
import {
  deviceCorrectionAtom,
  dismissInstallHintAtom,
  installHintDismissedAtom,
  saveDeviceCorrectionAtom,
  saveThemePreferenceAtom,
  themePreferenceAtom,
} from '../model/atoms';

import { appDbAtom, openAppDb, writeSetting } from '@/shared/api';

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

    await expect(loadAppSettings(db)).resolves.toEqual({
      themePreference: 'system',
      deviceCorrection: 0,
      installHintDismissed: false,
    });
    db.close();
  });

  it('пропускает запись, не прошедшую схему', async () => {
    const db = await openFreshDb();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await writeSetting(db, 'themePreference', 'sepia');

    await expect(loadAppSettings(db)).resolves.toEqual({
      themePreference: 'system',
      deviceCorrection: 0,
      installHintDismissed: false,
    });
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
    await expect(loadAppSettings(db)).resolves.toEqual({
      themePreference: 'dark',
      deviceCorrection: 0,
      installHintDismissed: false,
    });
    db.close();
  });

  it('без базы обновляет только атом', async () => {
    const store = createStore();

    await store.set(saveThemePreferenceAtom, 'light');

    expect(store.get(themePreferenceAtom)).toBe('light');
  });
});

describe('saveDeviceCorrectionAtom', () => {
  it('сохраняет поправку устройства и читает её при загрузке', async () => {
    const db = await openFreshDb();
    const store = createStore();
    store.set(appDbAtom, db);

    await store.set(saveDeviceCorrectionAtom, -0.5);

    expect(store.get(deviceCorrectionAtom)).toBe(-0.5);
    await expect(loadAppSettings(db)).resolves.toEqual({
      themePreference: 'system',
      deviceCorrection: -0.5,
      installHintDismissed: false,
    });
    db.close();
  });

  it('отбрасывает поправку вне допустимого диапазона', async () => {
    const db = await openFreshDb();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await writeSetting(db, 'deviceCorrection', 5);

    await expect(loadAppSettings(db)).resolves.toEqual({
      themePreference: 'system',
      deviceCorrection: 0,
      installHintDismissed: false,
    });

    warn.mockRestore();
    db.close();
  });
});

describe('dismissInstallHintAtom', () => {
  it('запоминает, что подсказку про установку закрыли', async () => {
    const db = await openFreshDb();
    const store = createStore();
    store.set(appDbAtom, db);

    await store.set(dismissInstallHintAtom);

    expect(store.get(installHintDismissedAtom)).toBe(true);
    await expect(loadAppSettings(db)).resolves.toMatchObject({ installHintDismissed: true });
    db.close();
  });
});
