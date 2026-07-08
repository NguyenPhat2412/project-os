/**
 * PageLoader
 * ──────────
 * Loading state chuẩn cho toàn bộ pages.
 * Dùng `<Spinner size="lg" />` bọc trong flex container.
 * KHÔNG viết inline trong page — luôn dùng component này.
 */
import { Spinner } from './spinner';

interface PageLoaderProps {
  className?: string;
}

export function PageLoader({ className }: PageLoaderProps) {
  return (
    <div className={`flex justify-center py-20${className ? ` ${className}` : ''}`}>
      <Spinner size='lg' className='border-primary border-t-transparent' />
    </div>
  );
}
