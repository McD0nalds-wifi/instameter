import type { UserCamera } from '../model/userCamera';
import type { AppDb } from '@/shared/api';

import * as v from 'valibot';

import { ActiveCameraIdSchema, UserCameraSchema } from '../model/userCamera';

import { readSetting, writeSetting } from '@/shared/api';

const ACTIVE_CAMERA_SETTING = 'activeCameraId';

const parseUserCamera = (record: unknown): UserCamera[] => {
  const result = v.safeParse(UserCameraSchema, record);

  if (!result.success) {
    console.warn('[userCameras] запись не прошла проверку и пропущена', result.issues);
    return [];
  }
  return [result.output];
};

export const loadUserCameras = async (db: AppDb): Promise<UserCamera[]> => {
  const records = await db.getAll('userCameras');
  return records
    .flatMap(parseUserCamera)
    .toSorted((left, right) => left.createdAt - right.createdAt);
};

export const saveUserCamera = async (db: AppDb, camera: UserCamera) => {
  await db.put('userCameras', camera);
};

export const deleteUserCamera = async (db: AppDb, id: string) => {
  await db.delete('userCameras', id);
};

export const loadActiveCameraId = async (db: AppDb): Promise<string | null> =>
  (await readSetting(db, ACTIVE_CAMERA_SETTING, ActiveCameraIdSchema)) ?? null;

export const saveActiveCameraId = async (db: AppDb, id: string | null) => {
  await writeSetting(db, ACTIVE_CAMERA_SETTING, id);
};
