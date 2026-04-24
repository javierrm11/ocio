import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushToTokens } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json();
  const record = payload.record;

  if (!record?.user_id || !record?.title || !record?.message) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: rows } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', record.user_id);

  if (!rows?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const tokens = rows.map((r) => r.token);
  const data = record.data && typeof record.data === 'object'
    ? Object.fromEntries(
        Object.entries(record.data).map(([k, v]) => [k, String(v)])
      )
    : undefined;

  await sendPushToTokens(tokens, record.title, record.message, data);

  return NextResponse.json({ ok: true, sent: tokens.length });
}