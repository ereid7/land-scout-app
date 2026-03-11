import { config } from 'dotenv';
import type { Config } from 'drizzle-kit';

config({ path: '.env.local' });
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV !== 'test') {
  throw new Error(
    'DATABASE_URL environment variable is required. Copy .env.local.example to .env.local and set it.',
  );
}

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public', 'neon_auth'],
  dbCredentials: {
    url: databaseUrl ?? 'postgresql://test:test@localhost:5432/test',
  },
} satisfies Config;
