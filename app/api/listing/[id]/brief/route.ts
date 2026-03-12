import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { generateBrief } from '@/lib/brief';
import { db, schema } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [listing] = await db
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.id, id))
    .limit(1);

  if (!listing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(generateBrief(listing));
}
