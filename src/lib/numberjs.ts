/**
 * numberjs.ts
 * ───────────
 * Formatting helpers cho số, tiền tệ, file size.
 * KHÔNG dùng Intl.NumberFormat hoặc local helper trong component.
 * Import từ đây thay vì viết local.
 */

/**
 * Format số tiền VND — rút gọn cho dashboard:
 *   >= 1B -> "₫1.5B"
 *   >= 1M -> "₫12M"
 *   còn lại -> "₫1,234,567"
 */
export function formatCurrencyVND(n: number): string {
  if (n >= 1_000_000_000) return `₫${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₫${Math.round(n / 1_000_000)}M`;
  return `₫${n.toLocaleString('vi-VN')}`;
}

/**
 * Format file size (bytes -> "1.2 MB", "500 KB", "300 B").
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
