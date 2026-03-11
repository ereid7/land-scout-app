import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import { databaseUrl } from '@/lib/env';

import * as schema from './schema';

const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });
export { schema };
