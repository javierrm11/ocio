import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushToTokens } from '@/lib/firebase-admin';

// Mensajes por día de la semana (en hora de Madrid, UTC+1/+2)
// El cron se ejecuta a las 17:00 UTC → 18:00–19:00 Madrid
const MESSAGES: Record<number, { title: string; body: string }> = {
  4: {
    title: '🕐 El finde empieza mañana',
    body: 'Jueves de previa — ¿ya sabes a dónde vas este fin de semana?',
  },
  5: {
    title: '🔥 Esta noche hay ambiente',
    body: 'Viernes de salida — descubre los locales más animados cerca de ti.',
  },
  6: {
    title: '🎉 Sábado noche',
    body: '¿Tienes plan? Mira qué está pasando ahora en tu zona.',
  },
};

const BATCH_SIZE = 500; // límite de FCM por llamada

export async function GET(request: NextRequest) {
  // Vercel pasa CRON_SECRET en la cabecera Authorization
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Día actual en hora de Madrid
  const nowMadrid = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' })
  );
  const day = nowMadrid.getDay();
  const msg = MESSAGES[day];

  if (!msg) {
    return NextResponse.json({ ok: true, skipped: true, day });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Obtener todos los tokens (paginado de 1000 en 1000)
  const allTokens: string[] = [];
  let from = 0;
  const PAGE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('push_tokens')
      .select('token')
      .range(from, from + PAGE - 1);

    if (error || !data?.length) break;
    allTokens.push(...data.map((r) => r.token));
    if (data.length < PAGE) break;
    from += PAGE;
  }

  if (!allTokens.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // Enviar en lotes de 500 (límite de FCM multicast)
  let sent = 0;
  for (let i = 0; i < allTokens.length; i += BATCH_SIZE) {
    const batch = allTokens.slice(i, i + BATCH_SIZE);
    await sendPushToTokens(batch, msg.title, msg.body);
    sent += batch.length;
  }

  return NextResponse.json({ ok: true, sent, day, title: msg.title });
}