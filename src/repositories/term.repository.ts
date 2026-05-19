import type { QueryResult } from 'react-native-quick-sqlite';
import type { TermStatus } from '../constants/termStatus';
import { TERM_STATUS } from '../constants/termStatus';
import { ACTIVITY_TYPE } from '../constants/activityTypes';
import { getDB } from '../db/client';
import type { Term } from '../constants/term.types';
import { todayISO } from '../utils/dateUtils';

export type TermWriteInput = Omit<Term, 'id' | 'createdAt'>;

function getRows<T>(result: QueryResult): T[] {
  return (result.rows?._array ?? []) as T[];
}

export function getAllTerms(): Term[] {
  const db = getDB();
  const result = db.execute(
    'SELECT * FROM terms ORDER BY expectedDate ASC, id DESC',
  );

  return getRows<Term>(result);
}

export function getTermsByCustomer(customerId: number): Term[] {
  const db = getDB();
  const result = db.execute(
    `
      SELECT *
      FROM terms
      WHERE customerId = ?
      ORDER BY expectedDate ASC, id DESC
    `,
    [customerId],
  );

  return getRows<Term>(result);
}

export function insertTerm(data: TermWriteInput): number {
  const db = getDB();
  const result = db.execute(
    `
      INSERT INTO terms (
        customerId,
        productName,
        orderDate,
        termDuration,
        expectedDate,
        status,
        arrivedAt,
        price,
        currency,
        stage
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.customerId,
      data.productName,
      data.orderDate,
      data.termDuration,
      data.expectedDate,
      data.status,
      data.arrivedAt,
      data.price ?? 0,
      data.currency ?? 'TRY',
      data.stage ?? 'firsat',
    ],
  );

  return result.insertId ?? 0;
}

export function updateTerm(termId: number, data: TermWriteInput): void {
  const db = getDB();

  db.execute(
    `
      UPDATE terms
      SET
        customerId = ?,
        productName = ?,
        orderDate = ?,
        termDuration = ?,
        expectedDate = ?,
        status = ?,
        arrivedAt = ?,
        price = ?,
        currency = ?,
        stage = ?
      WHERE id = ?
    `,
    [
      data.customerId,
      data.productName,
      data.orderDate,
      data.termDuration,
      data.expectedDate,
      data.status,
      data.arrivedAt,
      data.price ?? 0,
      data.currency ?? 'TRY',
      data.stage ?? 'firsat',
      termId,
    ],
  );
}

export function updateTermStatus(
  termId: number,
  customerId: number,
  status: TermStatus,
): void {
  const db = getDB();
  const today = todayISO();
  const existingResult = db.execute(
    'SELECT status FROM terms WHERE id = ? LIMIT 1',
    [termId],
  );
  const existingTerm = getRows<Pick<Term, 'status'>>(existingResult)[0];

  if (!existingTerm || existingTerm.status === status) {
    return;
  }

  db.execute('UPDATE terms SET status = ?, arrivedAt = ? WHERE id = ?', [
    status,
    status === TERM_STATUS.ARRIVED ? today : null,
    termId,
  ]);

  if (status === TERM_STATUS.ARRIVED) {
    db.execute(
      `
        INSERT INTO activities (customerId, date, type, note, relatedTermId)
        VALUES (?, ?, ?, ?, ?)
      `,
      [customerId, today, ACTIVITY_TYPE.PRODUCT_ARRIVED, null, termId],
    );
  }
}

export function updateTermStage(termId: number, stage: Term['stage']): void {
  const db = getDB();
  db.execute('UPDATE terms SET stage = ? WHERE id = ?', [stage, termId]);
}

export function deleteTermsByCustomerIds(customerIds: number[]): void {
  if (customerIds.length === 0) return;
  const db = getDB();
  const placeholders = customerIds.map(() => '?').join(', ');
  db.execute(`DELETE FROM terms WHERE customerId IN (${placeholders})`, customerIds);
}
