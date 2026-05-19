import type { QueryResult } from 'react-native-quick-sqlite';
import { getDB } from '../db/client';
import type { Customer } from '../constants/customer.types';

export type CustomerWriteInput = Omit<
  Customer,
  'id' | 'createdAt' | 'updatedAt'
> & {
  isDemo?: number;
};

function getRows<T>(result: QueryResult): T[] {
  return (result.rows?._array ?? []) as T[];
}

export function getAllCustomers(): Customer[] {
  const db = getDB();
  const result = db.execute(
    'SELECT * FROM customers ORDER BY customerName ASC',
  );

  return getRows<Customer>(result);
}

export function getCustomerById(customerId: number): Customer | null {
  const db = getDB();
  const result = db.execute('SELECT * FROM customers WHERE id = ? LIMIT 1', [
    customerId,
  ]);

  return getRows<Customer>(result)[0] ?? null;
}

export function insertCustomer(data: CustomerWriteInput): number {
  const db = getDB();
  const result = db.execute(
    'INSERT INTO customers (customerName, companyName, phone, email, isDemo) VALUES (?, ?, ?, ?, ?)',
    [
      data.customerName,
      data.companyName,
      data.phone,
      data.email,
      data.isDemo ?? 0,
    ],
  );

  return result.insertId ?? 0;
}

export function getDemoCustomerIds(): number[] {
  const db = getDB();
  const result = db.execute('SELECT id FROM customers WHERE isDemo = 1');
  return getRows<{ id: number }>(result).map(r => r.id);
}

export function deleteCustomersByIds(ids: number[]): void {
  if (ids.length === 0) return;
  const db = getDB();
  const placeholders = ids.map(() => '?').join(', ');
  db.execute(`DELETE FROM customers WHERE id IN (${placeholders})`, ids);
}

export function updateCustomer(
  customerId: number,
  data: CustomerWriteInput,
): void {
  const db = getDB();

  db.execute(
    `
      UPDATE customers
      SET
        customerName = ?,
        companyName = ?,
        phone = ?,
        email = ?,
        updatedAt = datetime('now')
      WHERE id = ?
    `,
    [data.customerName, data.companyName, data.phone, data.email, customerId],
  );
}
