import { getDB } from '../db/client';
import { Dirs, FileSystem } from 'react-native-file-access';
import * as XLSX from 'xlsx';
import type { Activity } from '../constants/activity.types';
import type { Customer } from '../constants/customer.types';
import type { Term } from '../constants/term.types';

export const BACKUP_VERSION = 1 as const;

export interface BackupPayload {
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  customers: Customer[];
  activities: Activity[];
  terms: Term[];
}

export interface BackupExportFile {
  filename: string;
  mimeType: string;
  path: string;
}

function getRows<T>(result: { rows?: { _array?: unknown[] } }): T[] {
  return (result.rows?._array ?? []) as T[];
}

function getMaxId(items: Array<{ id: number }>): number {
  return items.reduce((maxId, item) => Math.max(maxId, item.id), 0);
}

function syncSequence(tableName: 'customers' | 'activities' | 'terms', maxId: number): void {
  const db = getDB();

  db.execute('DELETE FROM sqlite_sequence WHERE name = ?', [tableName]);

  if (maxId > 0) {
    db.execute(
      'INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)',
      [tableName, maxId],
    );
  }
}

export function createBackupPayload(): BackupPayload {
  const db = getDB();

  const customers = getRows<Customer>(
    db.execute('SELECT * FROM customers ORDER BY id ASC'),
  );
  const activities = getRows<Activity>(
    db.execute('SELECT * FROM activities ORDER BY id ASC'),
  );
  const terms = getRows<Term>(
    db.execute('SELECT * FROM terms ORDER BY id ASC'),
  );

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    customers,
    activities,
    terms,
  };
}

export async function exportBackup(): Promise<string> {
  return JSON.stringify(createBackupPayload(), null, 2);
}

function createTimestampLabel(date = new Date()): string {
  const parts = [
    date.getFullYear(),
    `${date.getMonth() + 1}`.padStart(2, '0'),
    `${date.getDate()}`.padStart(2, '0'),
    `${date.getHours()}`.padStart(2, '0'),
    `${date.getMinutes()}`.padStart(2, '0'),
    `${date.getSeconds()}`.padStart(2, '0'),
  ];

  return parts.join('-');
}

function withAutofilter(
  rows: Array<Array<string | number | null>>,
): XLSX.WorkSheet {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const columnCount = rows[0]?.length ?? 1;
  const lastColumn = XLSX.utils.encode_col(Math.max(columnCount - 1, 0));

  worksheet['!autofilter'] = {
    ref: `A1:${lastColumn}${Math.max(rows.length, 1)}`,
  };

  return worksheet;
}

function toCellValue(value: string | number | null | undefined): string | number {
  return value ?? '';
}

function getColumnWidth(values: Array<string | number>, minWidth = 12, maxWidth = 28): number {
  const longest = values.reduce<number>((max, value) => {
    return Math.max(max, String(value).length);
  }, minWidth);

  return Math.min(Math.max(longest + 2, minWidth), maxWidth);
}

function applyColumnWidths(
  worksheet: XLSX.WorkSheet,
  rows: Array<Array<string | number | null>>,
): void {
  const columnCount = rows[0]?.length ?? 0;

  worksheet['!cols'] = Array.from({ length: columnCount }, (_, columnIndex) => ({
    wch: getColumnWidth(
      rows.map(row => toCellValue(row[columnIndex])),
    ),
  }));
}

function ensureExportDirectory(): Promise<string> {
  const exportDir = `${Dirs.CacheDir}/exports`;

  return FileSystem.exists(exportDir).then(async exists => {
    if (!exists) {
      await FileSystem.mkdir(exportDir);
    }

    return exportDir;
  });
}

function formatExportValue(value: string | null | undefined): string {
  return value?.trim() ? value : '-';
}

function buildExcelWorkbook(payload: BackupPayload): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  const customerMap = new Map(payload.customers.map(customer => [customer.id, customer]));
  const termMap = new Map(payload.terms.map(term => [term.id, term]));

  const summaryRows: Array<Array<string | number>> = [
    ['Alan', 'Değer'],
    ['Dışa Aktarılma Tarihi', payload.exportedAt],
    ['Yedek Sürümü', payload.version],
    ['Müşteri Sayısı', payload.customers.length],
    ['Aktivite Sayısı', payload.activities.length],
    ['Termin Sayısı', payload.terms.length],
  ];

  const customerRows: Array<Array<string | number | null>> = [
    [
      'ID',
      'Müşteri Adı',
      'Firma Adı',
      'Telefon',
      'E-posta',
      'Oluşturulma Tarihi',
      'Güncellenme Tarihi',
    ],
    ...payload.customers.map(customer => [
      customer.id,
      customer.customerName,
      customer.companyName,
      formatExportValue(customer.phone),
      formatExportValue(customer.email),
      customer.createdAt,
      customer.updatedAt,
    ]),
  ];

  const termRows: Array<Array<string | number | null>> = [
    [
      'ID',
      'Müşteri ID',
      'Müşteri Adı',
      'Firma Adı',
      'Ürün Adı',
      'Sipariş Tarihi',
      'Beklenen Tarih',
      'Termin Süresi',
      'Durum',
      'Teslim Tarihi',
      'Oluşturulma Tarihi',
    ],
    ...payload.terms.map(term => {
      const customer = customerMap.get(term.customerId);

      return [
        term.id,
        term.customerId,
        customer?.customerName ?? '',
        customer?.companyName ?? '',
        term.productName,
        term.orderDate,
        term.expectedDate,
        formatExportValue(term.termDuration),
        term.status,
        formatExportValue(term.arrivedAt),
        term.createdAt,
      ];
    }),
  ];

  const activityRows: Array<Array<string | number | null>> = [
    [
      'ID',
      'Müşteri ID',
      'Müşteri Adı',
      'Firma Adı',
      'Tarih',
      'Aktivite Türü',
      'Not',
      'İlgili Termin ID',
      'İlgili Ürün',
      'Oluşturulma Tarihi',
    ],
    ...payload.activities.map(activity => {
      const customer = customerMap.get(activity.customerId);
      const relatedTerm = activity.relatedTermId
        ? termMap.get(activity.relatedTermId)
        : null;

      return [
        activity.id,
        activity.customerId,
        customer?.customerName ?? '',
        customer?.companyName ?? '',
        activity.date,
        activity.type,
        formatExportValue(activity.note),
        activity.relatedTermId ?? '-',
        formatExportValue(relatedTerm?.productName),
        activity.createdAt,
      ];
    }),
  ];

  const summarySheet = withAutofilter(summaryRows);
  const customersSheet = withAutofilter(customerRows);
  const termsSheet = withAutofilter(termRows);
  const activitiesSheet = withAutofilter(activityRows);

  applyColumnWidths(summarySheet, summaryRows);
  applyColumnWidths(customersSheet, customerRows);
  applyColumnWidths(termsSheet, termRows);
  applyColumnWidths(activitiesSheet, activityRows);

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ozet');
  XLSX.utils.book_append_sheet(workbook, customersSheet, 'Musteriler');
  XLSX.utils.book_append_sheet(workbook, termsSheet, 'Terminler');
  XLSX.utils.book_append_sheet(workbook, activitiesSheet, 'Aktiviteler');

  workbook.Props = {
    Title: 'Saha CRM Yedegi',
    Subject: 'Saha CRM Excel Disa Aktarimi',
    Author: 'Saha CRM',
    CreatedDate: new Date(payload.exportedAt),
  };

  return workbook;
}

export async function exportBackupExcelFile(): Promise<BackupExportFile> {
  const payload = createBackupPayload();
  const workbook = buildExcelWorkbook(payload);
  const exportDir = await ensureExportDirectory();
  const filename = `saha-crm-backup-${createTimestampLabel()}.xlsx`;
  const path = `${exportDir}/${filename}`;
  const base64Workbook = XLSX.write(workbook, {
    type: 'base64',
    bookType: 'xlsx',
    compression: true,
  });

  await FileSystem.writeFile(path, base64Workbook, 'base64');

  return {
    filename,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    path,
  };
}

export async function exportBackupJsonFile(): Promise<BackupExportFile> {
  const exportDir = await ensureExportDirectory();
  const filename = `saha-crm-backup-${createTimestampLabel()}.json`;
  const path = `${exportDir}/${filename}`;
  const payload = await exportBackup();

  await FileSystem.writeFile(path, payload, 'utf8');

  return {
    filename,
    mimeType: 'application/json',
    path,
  };
}

function parseBackupPayload(payload: BackupPayload | string): BackupPayload {
  const parsedPayload = typeof payload === 'string'
    ? JSON.parse(payload)
    : payload;

  if (
    !parsedPayload ||
    typeof parsedPayload !== 'object' ||
    parsedPayload.version !== BACKUP_VERSION ||
    !Array.isArray(parsedPayload.customers) ||
    !Array.isArray(parsedPayload.activities) ||
    !Array.isArray(parsedPayload.terms)
  ) {
    throw new Error('Invalid backup payload.');
  }

  return parsedPayload;
}

export async function importBackup(payload: BackupPayload | string): Promise<void> {
  const parsedPayload = parseBackupPayload(payload);
  const db = getDB();

  db.execute('BEGIN');

  try {
    db.execute('DELETE FROM activities');
    db.execute('DELETE FROM terms');
    db.execute('DELETE FROM customers');

    parsedPayload.customers.forEach(customer => {
      db.execute(
        `
          INSERT INTO customers (
            id,
            customerName,
            companyName,
            phone,
            email,
            createdAt,
            updatedAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          customer.id,
          customer.customerName,
          customer.companyName,
          customer.phone,
          customer.email,
          customer.createdAt,
          customer.updatedAt,
        ],
      );
    });

    parsedPayload.terms.forEach(term => {
      db.execute(
        `
          INSERT INTO terms (
            id,
            customerId,
            productName,
            orderDate,
            termDuration,
            expectedDate,
            status,
            arrivedAt,
            createdAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          term.id,
          term.customerId,
          term.productName,
          term.orderDate,
          term.termDuration,
          term.expectedDate,
          term.status,
          term.arrivedAt,
          term.createdAt,
        ],
      );
    });

    parsedPayload.activities.forEach(activity => {
      db.execute(
        `
          INSERT INTO activities (
            id,
            customerId,
            date,
            type,
            note,
            relatedTermId,
            createdAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          activity.id,
          activity.customerId,
          activity.date,
          activity.type,
          activity.note,
          activity.relatedTermId,
          activity.createdAt,
        ],
      );
    });

    syncSequence('customers', getMaxId(parsedPayload.customers));
    syncSequence('terms', getMaxId(parsedPayload.terms));
    syncSequence('activities', getMaxId(parsedPayload.activities));

    db.execute('COMMIT');
  } catch (error) {
    db.execute('ROLLBACK');
    throw error;
  }
}
