import type {
  QuickSQLiteConnection,
  QueryResult,
} from 'react-native-quick-sqlite';
import { getDB } from './client';

interface Migration {
  version: number;
  statements: readonly string[];
}

const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    statements: [
      `
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customerName TEXT NOT NULL,
          companyName TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          isDemo INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT DEFAULT (datetime('now')),
          updatedAt TEXT DEFAULT (datetime('now'))
        )
      `,
      `
        CREATE TABLE IF NOT EXISTS terms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customerId INTEGER NOT NULL,
          productName TEXT NOT NULL,
          orderDate TEXT NOT NULL,
          termDuration TEXT NOT NULL,
          expectedDate TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'Bekleniyor',
          arrivedAt TEXT,
          createdAt TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (customerId) REFERENCES customers(id)
        )
      `,
      `
        CREATE TABLE IF NOT EXISTS activities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customerId INTEGER NOT NULL,
          date TEXT NOT NULL,
          type TEXT NOT NULL,
          note TEXT,
          relatedTermId INTEGER,
          createdAt TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (customerId) REFERENCES customers(id),
          FOREIGN KEY (relatedTermId) REFERENCES terms(id)
        )
      `,
      'CREATE INDEX IF NOT EXISTS idx_activities_customer_date ON activities(customerId, date DESC, id DESC)',
      'CREATE INDEX IF NOT EXISTS idx_terms_customer_expected_date ON terms(customerId, expectedDate ASC, id DESC)',
    ],
  },
  {
    version: 2,
    statements: [
      `ALTER TABLE terms ADD COLUMN price REAL DEFAULT 0;`,
      `ALTER TABLE terms ADD COLUMN currency TEXT DEFAULT 'TRY';`,
      `ALTER TABLE terms ADD COLUMN stage TEXT DEFAULT 'firsat';`,
      `CREATE TABLE IF NOT EXISTS feature_usage (
        feature_key TEXT PRIMARY KEY,
        usage_count INTEGER DEFAULT 0,
        period_start TEXT NOT NULL,
        is_premium INTEGER DEFAULT 0
      );`,
    ],
  },
  {
    version: 3,
    statements: [
      `ALTER TABLE customers ADD COLUMN isDemo INTEGER NOT NULL DEFAULT 0;`,
    ],
  },
] as const;

export const CURRENT_DB_VERSION =
  MIGRATIONS[MIGRATIONS.length - 1]?.version ?? 0;

function getRows<T>(result: QueryResult): T[] {
  return (result.rows?._array ?? []) as T[];
}

function getCurrentUserVersion(db: QuickSQLiteConnection): number {
  const result = db.execute('PRAGMA user_version');
  const row = getRows<{ user_version?: number }>(result)[0];

  return row?.user_version ?? 0;
}

function applyMigration(db: QuickSQLiteConnection, migration: Migration): void {
  migration.statements.forEach(statement => {
    db.execute(statement);
  });

  db.execute(`PRAGMA user_version = ${migration.version}`);
}

export function initDatabase(): void {
  const db = getDB();

  db.execute('PRAGMA foreign_keys = ON');

  const currentVersion = getCurrentUserVersion(db);
  const pendingMigrations = MIGRATIONS.filter(
    migration => migration.version > currentVersion,
  );

  if (pendingMigrations.length === 0) {
    return;
  }

  db.execute('BEGIN');

  try {
    pendingMigrations.forEach(migration => {
      applyMigration(db, migration);
    });

    db.execute('COMMIT');
  } catch (error) {
    db.execute('ROLLBACK');
    throw error;
  }
}
