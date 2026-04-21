import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth/get-user';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const body = await request.json();
  const { token } = body as { token: string };

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
  }

  const supabase = await createClient();

  // Upsert: si el token ya existe para este usuario, no duplicar
  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      { user_id: userId, token, updated_at: new Date().toISOString() },
      { onConflict: 'token' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
