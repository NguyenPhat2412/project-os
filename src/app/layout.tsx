import type { Metadata } from 'next';

import './globals.css';

import { LayoutShell } from '@/components/layout/LayoutShell';
import { AuthProvider } from '@/contexts/auth-context';
import { NextAuthSessionProvider } from '@/components/providers/nextauth-session-provider';
import { ReactQueryProvider } from '@/lib/firestore-rq/ReactQueryProvider';

export const metadata: Metadata = {
  title: 'ProjectOS — Enterprise',
  description: 'Hệ thống quản lý dự án',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='vi' suppressHydrationWarning>
      <body className='antialiased'>
        <ReactQueryProvider>
          <NextAuthSessionProvider>
            <AuthProvider>
              <LayoutShell>{children}</LayoutShell>
            </AuthProvider>
          </NextAuthSessionProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
