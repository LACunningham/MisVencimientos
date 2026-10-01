export const DATABASE_NAME = 'mis-vencimientos.db';

const MIGRATION_V1 = `
CREATE TABLE IF NOT EXISTS bills (
  id TEXT PRIMARY KEY NOT NULL,
  catalog_id TEXT,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  monto INTEGER NOT NULL,
  fecha TEXT NOT NULL,
  color TEXT NOT NULL,
  icono TEXT NOT NULL,
  es_suscripcion INTEGER NOT NULL DEFAULT 0,
  pagado INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY NOT NULL,
  bill_id TEXT NOT NULL,
  monto INTEGER NOT NULL,
  fecha TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (bill_id) REFERENCES bills (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_bill ON payments (bill_id);
`;

const MIGRATIONS: Record<number, string> = {
  1: MIGRATION_V1,
};

export const LATEST_VERSION = Math.max(...Object.keys(MIGRATIONS).map(Number));

/**
 * Aplica las migraciones pendientes usando `PRAGMA user_version` como versionado.
 * Debe correr una sola vez por versión, sincrónicamente, antes de leer datos.
 */
export function migrate(
  db: {
    execSync: (source: string) => void;
    getFirstSync: <T>(source: string) => T | null;
  },
): void {
  db.execSync('PRAGMA journal_mode = WAL;');
  db.execSync('PRAGMA foreign_keys = ON;');

  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version;');
  const versionActual = row?.user_version ?? 0;

  for (let version = versionActual + 1; version <= LATEST_VERSION; version += 1) {
    const migration = MIGRATIONS[version];

    if (!migration) {
      continue;
    }

    db.execSync(migration);
    db.execSync(`PRAGMA user_version = ${version};`);
  }
}