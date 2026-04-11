import { getUserId } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const supabase = await createClient();

  const [{ data: profile }, { data: transactions }] = await Promise.all([
    supabase.from('profiles').select('points').eq('id', userId).single(),
    supabase
      .from('point_transactions')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({
    total: profile?.points ?? 0,
    transactions: transactions ?? [],
  });
}
