import { createNeonAuth } from '@neondatabase/auth/next/server';

const baseUrl =
  process.env.NEON_AUTH_BASE_URL ?? 'https://ep-placeholder.neon.tech/neondb/auth';
const cookieSecret =
  process.env.NEON_AUTH_COOKIE_SECRET ??
  'replace-with-a-32-character-secret-value';

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
  },
});
