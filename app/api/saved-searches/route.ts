export const dynamic = 'force-dynamic';

import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth/server';
import { db, schema } from '@/lib/db';

async function getCurrentUser() {
  const { data: session } = await auth.getSession();
  return session?.user ?? null;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searches = await db
    .select()
    .from(schema.savedSearches)
    .where(eq(schema.savedSearches.userId, user.id));

  return NextResponse.json(searches);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    filters?: Record<string, unknown>;
    name?: string;
    notify?: boolean;
  };

  if (!body.name?.trim() || !body.filters || typeof body.filters !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const [saved] = await db
    .insert(schema.savedSearches)
    .values({
      userId: user.id,
      name: body.name.trim(),
      filters: body.filters,
      notify: body.notify ?? false,
    })
    .returning();

  return NextResponse.json(saved, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  await db
    .delete(schema.savedSearches)
    .where(and(eq(schema.savedSearches.id, body.id), eq(schema.savedSearches.userId, user.id)));

  return NextResponse.json({ ok: true });
}
