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
  const authEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true';

  return (
    <html lang="en">
      <body>{authEnabled ? <AuthProvider>{children}</AuthProvider> : children}</body>
    </html>
  );
}
