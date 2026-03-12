import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import AuthProvider from '@/components/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Land Scout — Find Rural Land Deals',
  description: 'Automated scanning of 90+ sources. Find undervalued rural land before anyone else.',
  openGraph: {
    title: 'Land Scout',
    description: 'Find undervalued rural land deals across 19 states.',
  },
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
