import { createStore } from 'jotai';

import { loadActiveCameraId, loadUserCameras } from '../api/userCameraRepository';
import {
  activeCameraAtom,
  activeCameraIdAtom,
  addUserCameraAtom,
  removeUserCameraAtom,
  updateUserCameraAtom,
  userCamerasAtom,
} from '../model/atoms';
import { createUserCameraFromSpec, resolveCameraSpec } from '../model/userCamera';

import { findCameraSpec } from '@/entities/camera/@x/userCamera';
import { appDbAtom, openAppDb } from '@/shared/api';

const lomoWide = findCameraSpec('lomo-instant-wide')!;
const polaroid = findCameraSpec('polaroid-i-2')!;

const setupStore = async () => {
  const db = await openAppDb(crypto.randomUUID());
  const store = createStore();
  store.set(appDbAtom, db);
  return { db, store };
};

describe('createUserCameraFromSpec', () => {
  it('берёт имя модели и первую плёнку из каталога', () => {
    const camera = createUserCameraFromSpec(polaroid, 1000, '6f1c2b1e-1d2a-4c3b-9e8f-0a1b2c3d4e5f');

    expect(camera).toEqual({
      id: '6f1c2b1e-1d2a-4c3b-9e8f-0a1b2c3d4e5f',
      specId: 'polaroid-i-2',
      nickname: 'Polaroid I-2',
      loadedFilmId: 'polaroid-i-type',
      createdAt: 1000,
    });
    expect(resolveCameraSpec(camera)).toBe(polaroid);
  });
});

describe('мои камеры', () => {
  it('добавленная камера сохраняется и становится активной', async () => {
    const { db, store } = await setupStore();
    const first = createUserCameraFromSpec(lomoWide, 1);
    const second = createUserCameraFromSpec(polaroid, 2);

    await store.set(addUserCameraAtom, first);
    await store.set(addUserCameraAtom, second);

    expect(store.get(activeCameraAtom)).toEqual(second);
    await expect(loadUserCameras(db)).resolves.toEqual([first, second]);
    await expect(loadActiveCameraId(db)).resolves.toBe(second.id);
    db.close();
  });

  it('при удалении активной камеры активной становится первая оставшаяся', async () => {
    const { db, store } = await setupStore();
    const first = createUserCameraFromSpec(lomoWide, 1);
    const second = createUserCameraFromSpec(polaroid, 2);
    await store.set(addUserCameraAtom, first);
    await store.set(addUserCameraAtom, second);

    await store.set(removeUserCameraAtom, second.id);

    expect(store.get(userCamerasAtom)).toEqual([first]);
    expect(store.get(activeCameraIdAtom)).toBe(first.id);
    await expect(loadUserCameras(db)).resolves.toEqual([first]);

    await store.set(removeUserCameraAtom, first.id);

    expect(store.get(activeCameraAtom)).toBeNull();
    await expect(loadActiveCameraId(db)).resolves.toBeNull();
    db.close();
  });

  it('сохраняет смену заряженной плёнки', async () => {
    const { db, store } = await setupStore();
    const camera = createUserCameraFromSpec(polaroid, 1);
    await store.set(addUserCameraAtom, camera);

    await store.set(updateUserCameraAtom, { ...camera, loadedFilmId: 'polaroid-sx-70' });

    expect(store.get(activeCameraAtom)?.loadedFilmId).toBe('polaroid-sx-70');
    await expect(loadUserCameras(db)).resolves.toMatchObject([{ loadedFilmId: 'polaroid-sx-70' }]);
    db.close();
  });

  it('без сохранённого id активной считается первая камера', () => {
    const store = createStore();
    const camera = createUserCameraFromSpec(lomoWide, 1);
    store.set(userCamerasAtom, [camera]);

    expect(store.get(activeCameraAtom)).toEqual(camera);
  });

  it('пропускает битую запись при загрузке', async () => {
    const { db } = await setupStore();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const camera = createUserCameraFromSpec(lomoWide, 1);
    await db.put('userCameras', camera);
    await db.put('userCameras', { id: 'broken', nickname: '' });

    await expect(loadUserCameras(db)).resolves.toEqual([camera]);
    expect(warn).toHaveBeenCalledOnce();

    warn.mockRestore();
    db.close();
  });
});
