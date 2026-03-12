export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

import { db, schema } from '@/lib/db';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let payload: { email?: unknown };

  try {
    payload = (await request.json()) as { email?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';

  if (!email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  try {
    await db
      .insert(schema.waitlist)
      .values({
        email,
        source: 'landing',
      })
      .onConflictDoNothing({
        target: schema.waitlist.email,
      });
  } catch (error) {
    console.warn('Waitlist signup could not be persisted. Continuing without storage.', error);
    return NextResponse.json({ ok: true, stored: false });
  }

  return NextResponse.json({ ok: true });
}
