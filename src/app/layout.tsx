import type { Metadata } from 'next';

import './globals.css';

import { LayoutShell } from '@/components/layout/LayoutShell';
import { AuthProvider } from '@/contexts/auth-context';
import { ReactQueryProvider } from '@/lib/firestore-rq/ReactQueryProvider';

export const metadata: Metadata = {
  title: 'ProjectOS — Enterprise',
  description: 'Hệ thống quản lý dự án',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='vi' data-scroll-behavior='smooth' suppressHydrationWarning>
      <body className='antialiased'>
        <ReactQueryProvider>
          <AuthProvider>
            <LayoutShell>{children}</LayoutShell>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
