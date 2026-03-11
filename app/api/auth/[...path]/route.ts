import { createNeonAuth } from '@neondatabase/auth/next/server';

const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET || 'dev-secret-must-be-at-least-32-chars-long',
  },
});

export const { GET, POST, PUT, DELETE, PATCH } = auth.handler();
