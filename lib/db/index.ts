import { drizzle as drizzleNodePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleNeonHttp } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import pg from 'pg';

import * as schema from './schema';

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://placeholder:placeholder@localhost/landscout?sslmode=require';

function createDb() {
  if (databaseUrl.includes('neon.tech') || databaseUrl.includes('neon.database')) {
    const sql = neon(databaseUrl);
    return drizzleNeonHttp(sql, { schema });
  }
  const pool = new pg.Pool({ connectionString: databaseUrl });
  return drizzleNodePg(pool, { schema });
}

export const db = createDb();
export { schema };
