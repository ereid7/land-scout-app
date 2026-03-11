import { NextResponse } from 'next/server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase-server';

export async function GET(
  _request: Request,
  context: { params: { id: string } },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', context.params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  });
}
