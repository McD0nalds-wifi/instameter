import { APP_DB_VERSION, openAppDb } from '../appDb';

describe('openAppDb', () => {
  it('создаёт хранилища первой версии схемы', async () => {
    const db = await openAppDb(crypto.randomUUID());

    expect(db.version).toBe(APP_DB_VERSION);
    expect([...db.objectStoreNames].toSorted((left, right) => left.localeCompare(right))).toEqual([
      'appSettings',
      'userCameras',
    ]);
    expect(db.transaction('userCameras').store.keyPath).toBe('id');
    expect(db.transaction('appSettings').store.keyPath).toBe('key');

    db.close();
  });
});
