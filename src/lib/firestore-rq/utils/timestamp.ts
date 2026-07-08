// lib/firestore-rq/utils/timestamp.ts
import type { Timestamp } from 'firebase/firestore';

/**
 * Convert various date representations to Date object.
 * Handles: Firestore Timestamp, Date, ISO string, or null/undefined.
 * Returns null for invalid/unsupported formats.
 */
export function toDate(value: Timestamp | Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined) return null;

  // Already a Date
  if (value instanceof Date) return value;

  // Firestore Timestamp - has toDate() method
  if (typeof value === 'object' && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    try {
      return (value as Timestamp).toDate();
    } catch {
      return null;
    }
  }

  // ISO string or number timestamp
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}
