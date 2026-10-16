import type { AppDb } from '@/shared/api';
import type { GenericSchema } from 'valibot';

import * as v from 'valibot';

export type SettingKey = 'themePreference' | 'deviceCorrection';

export const readSetting = async <TValue>(
  db: AppDb,
  key: SettingKey,
  schema: GenericSchema<TValue>,
): Promise<TValue | undefined> => {
  const record = await db.get('appSettings', key);

  if (record === undefined) {
    return undefined;
  }
  const result = v.safeParse(v.object({ key: v.literal(key), value: schema }), record);

  if (!result.success) {
    console.warn(`[appSettings] запись ${key} не прошла проверку и пропущена`, result.issues);
    return undefined;
  }
  return result.output.value;
};

export const writeSetting = async <TValue>(db: AppDb, key: SettingKey, value: TValue) => {
  await db.put('appSettings', { key, value });
};
