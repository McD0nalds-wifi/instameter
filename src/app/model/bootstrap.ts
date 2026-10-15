import { createStore } from 'jotai';

import { applyTheme, DARK_SCHEME_QUERY } from './theme';

import { loadAppSettings, resolveTheme, themePreferenceAtom } from '@/entities/preference';
import { appDbAtom, openAppDb } from '@/shared/api';

export type AppStore = ReturnType<typeof createStore>;

const openDbSafely = async () => {
  try {
    return await openAppDb();
  } catch (error) {
    console.error('[db] не удалось открыть базу, приложение работает без хранилища', error);
    return null;
  }
};

const hydrateSettings = async (store: AppStore) => {
  const db = store.get(appDbAtom);

  if (!db) {
    return;
  }
  try {
    const settings = await loadAppSettings(db);
    store.set(themePreferenceAtom, settings.themePreference);
  } catch (error) {
    console.error(
      '[appSettings] не удалось прочитать настройки, взяты значения по умолчанию',
      error,
    );
  }
};

export const bootstrap = async (): Promise<AppStore> => {
  const store = createStore();
  store.set(appDbAtom, await openDbSafely());
  await hydrateSettings(store);

  const systemPrefersDark = window.matchMedia(DARK_SCHEME_QUERY).matches;
  applyTheme(resolveTheme(store.get(themePreferenceAtom), systemPrefersDark));

  return store;
};
