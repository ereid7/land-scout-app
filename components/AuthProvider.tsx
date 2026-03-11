'use client';

import type { ComponentProps, ReactNode } from 'react';
import { NeonAuthUIProvider } from '@neondatabase/auth/react/ui';

import { authClient } from '@/lib/auth/client';

const providerAuthClient =
  authClient as unknown as ComponentProps<typeof NeonAuthUIProvider>['authClient'];

export default function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <NeonAuthUIProvider authClient={providerAuthClient} emailOTP social={{ providers: ['google'] }}>
      {children}
    </NeonAuthUIProvider>
  );
}
