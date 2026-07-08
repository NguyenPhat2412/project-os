/**
 * dayjs.ts
 * ────────
 * Configure dayjs với Vietnamese locale mặc định.
 * Import từ đây thay vì import trực tiếp từ 'dayjs'.
 *
 * Cung cấp các helper function thống nhất cho date/time formatting.
 * KHÔNG dùng Intl.DateTimeFormat hoặc new Date() trực tiếp.
 */

import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.locale('vi');

export default dayjs;

// ─── Formatters ──────────────────────────────────────────────────────────────

/**
 * Format date string sang DD/MM/YYYY (tiếng Việt).
 * Trả về "—" nếu giá trị rỗng hoặc không hợp lệ.
 */
export function formatDateVi(value: string | undefined | null, inputFmt?: string): string {
  if (!value) return '—';
  const parsed = inputFmt ? dayjs(value, inputFmt) : dayjs(value);
  if (!parsed.isValid()) return value;
  return parsed.locale('vi').format('DD/MM/YYYY');
}

/**
 * Trả về chuỗi ngày hiện tại theo format DD/MM/YYYY.
 * Dùng cho defaultValues trong form (khởi tạo ngày hôm nay).
 */
export function currentDate(): string {
  return dayjs().format('DD/MM/YYYY');
}

/**
 * Trả về ngày hôm qua theo format DD/MM/YYYY.
 */
export function yesterdayDate(): string {
  return dayjs().subtract(1, 'day').format('DD/MM/YYYY');
}

/**
 * Format một JS Date hoặc date string theo format bất kỳ.
 * @param value  — Date object hoặc chuỗi ngày
 * @param fmt    — output format (mặc định DD/MM/YYYY)
 */
export function formatDate(value: Date | string | undefined | null, fmt = 'DD/MM/YYYY'): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? dayjs(value) : dayjs(value);
  return d.isValid() ? d.locale('vi').format(fmt) : '—';
}

/**
 * Trả về "hôm nay", "hôm qua", "X ngày trước" hoặc "DD/MM/YYYY".
 */
export function formatDateRelative(value: string | undefined | null): string {
  if (!value) return '—';
  const d = dayjs(value, 'DD/MM/YYYY', true);
  if (!d.isValid()) {
    const d2 = dayjs(value);
    if (!d2.isValid()) return value;
    if (d2.isToday()) return 'Hôm nay';
    if (d2.isYesterday()) return 'Hôm qua';
    return d2.locale('vi').format('DD/MM/YYYY');
  }
  if (d.isToday()) return 'Hôm nay';
  if (d.isYesterday()) return 'Hôm qua';
  return d.fromNow();
}

/**
 * Kiểm tra một chuỗi ngày (DD/MM/YYYY) có phải là hôm qua trở về trước không.
 */
export function isOverdue(deadline: string | undefined | null): boolean {
  if (!deadline) return false;
  const d = dayjs(deadline, 'DD/MM/YYYY', true);
  if (!d.isValid()) return false;
  return d.isBefore(dayjs(), 'day');
}


