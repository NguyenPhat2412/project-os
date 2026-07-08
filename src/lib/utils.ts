import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// NOTE: Date formatting dùng dayjs từ @/lib/dayjs
// NOTE: Currency/number formatting: dùng formatCurrencyVND, formatFileSize từ @/lib/numberjs

/**
 * Chuyển string thành safe slug (document ID).
 * VD: "QA Engineers" → "qa-engineers", "DevOps / SRE" → "devops-sre"
 */
export function slugify(str: string): string {
  return (
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // bỏ dấu tiếng Việt
      .replace(/[^a-z0-9]+/g, '-')       // ký tự đặc biệt → gạch nối
      .replace(/^-+|-+$/g, '')           // bỏ dash đầu/cuối
  ) || 'role';
}
