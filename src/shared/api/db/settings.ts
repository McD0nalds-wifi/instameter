import type { AppDb } from './appDb';
import type { GenericSchema } from 'valibot';

import * as v from 'valibot';

export const readSetting = async <TValue>(
  db: AppDb,
  key: string,
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

export const writeSetting = async <TValue>(db: AppDb, key: string, value: TValue) => {
  await db.put('appSettings', { key, value });
};
