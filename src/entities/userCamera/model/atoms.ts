import type { UserCamera } from './userCamera';

import { atom } from 'jotai';

import { deleteUserCamera, saveActiveCameraId, saveUserCamera } from '../api/userCameraRepository';

import { appDbAtom } from '@/shared/api';

export const userCamerasAtom = atom<UserCamera[]>([]);

export const activeCameraIdAtom = atom<string | null>(null);

export const activeCameraAtom = atom((get): UserCamera | null => {
  const cameras = get(userCamerasAtom);
  const activeId = get(activeCameraIdAtom);
  return cameras.find(({ id }) => id === activeId) ?? cameras[0] ?? null;
});

export const setActiveCameraAtom = atom(null, async (get, set, id: string | null) => {
  const db = get(appDbAtom);

  if (db) {
    await saveActiveCameraId(db, id);
  }
  set(activeCameraIdAtom, id);
});

export const addUserCameraAtom = atom(null, async (get, set, camera: UserCamera) => {
  const db = get(appDbAtom);

  if (db) {
    await saveUserCamera(db, camera);
  }
  set(userCamerasAtom, [...get(userCamerasAtom), camera]);
  await set(setActiveCameraAtom, camera.id);
});

export const updateUserCameraAtom = atom(null, async (get, set, camera: UserCamera) => {
  const db = get(appDbAtom);

  if (db) {
    await saveUserCamera(db, camera);
  }
  set(
    userCamerasAtom,
    get(userCamerasAtom).map((current) => (current.id === camera.id ? camera : current)),
  );
});

export const removeUserCameraAtom = atom(null, async (get, set, id: string) => {
  const db = get(appDbAtom);

  if (db) {
    await deleteUserCamera(db, id);
  }
  const remaining = get(userCamerasAtom).filter((camera) => camera.id !== id);
  set(userCamerasAtom, remaining);

  if (get(activeCameraIdAtom) === id) {
    await set(setActiveCameraAtom, remaining[0]?.id ?? null);
  }
});
