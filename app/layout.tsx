import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import AuthProvider from '@/components/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Land Scout',
  description: 'Next.js + Neon + Drizzle land scouting dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
