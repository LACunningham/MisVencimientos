import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_NAME, migrate } from './schema';

export const isPersistenceEnabled = true;

let db: SQLiteDatabase | null = null;

/** Abre (y migra) la base una sola vez. */
export function getDatabase(): SQLiteDatabase | null {
  if (db === null) {
    db = openDatabaseSync(DATABASE_NAME);
    migrate(db);
  }

  return db;
}

export function closeDatabase(): void {
  db?.closeSync();
  db = null;
}