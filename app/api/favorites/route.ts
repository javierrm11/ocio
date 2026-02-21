import { getUserId } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }
  const supabase = await createClient();

  const query = supabase.from("favorites").select("*").eq("user_id", userId);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

// crear un nuevo favorito para el usuario autenticado
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }
  const supabase = await createClient();
  const body = await request.json();

  const {
    venue_id
  } = body;


  const { data, error } = await supabase
    .from("favorites")
    .insert({
      user_id: userId,
      venue_id
    })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}