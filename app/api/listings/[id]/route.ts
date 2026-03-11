import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, schema } from '@/lib/db';
import { hasDatabaseUrl } from '@/lib/env';
import { toListingWithLocation } from '@/lib/listing-helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasDatabaseUrl) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  const { id } = await params;

  const [listing] = await db
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.id, id))
    .limit(1);

  if (!listing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(toListingWithLocation(listing));
}
