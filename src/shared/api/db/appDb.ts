import type { DBSchema, IDBPDatabase } from 'idb';

import { openDB } from 'idb';

export interface AppDbSchema extends DBSchema {
  userCameras: {
    key: string;
    value: unknown;
  };
  appSettings: {
    key: string;
    value: unknown;
  };
}

export type AppDb = IDBPDatabase<AppDbSchema>;

type Migration = (db: AppDb) => void;

const migrations: Migration[] = [
  (db) => {
    db.createObjectStore('userCameras', { keyPath: 'id' });
    db.createObjectStore('appSettings', { keyPath: 'key' });
  },
];

export const APP_DB_NAME = 'instameter';
export const APP_DB_VERSION = migrations.length;

const runMigrations = (db: AppDb, oldVersion: number) => {
  migrations.slice(oldVersion).forEach((migrate, index) => {
    migrate(db);
    console.info(`[db] схема обновлена до версии ${oldVersion + index + 1}`);
  });
};

export const openAppDb = (name: string = APP_DB_NAME): Promise<AppDb> =>
  openDB<AppDbSchema>(name, APP_DB_VERSION, {
    upgrade: (db, oldVersion) => runMigrations(db, oldVersion),
  });
