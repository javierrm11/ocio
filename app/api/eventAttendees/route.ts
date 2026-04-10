import { getUserId } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { profile } from "console";
import { NextResponse } from "next/server";
import { use } from "react";

// obtener todas las companies, con filtro opcional por cualquier campo
export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  let query = supabase.from("event_attendees").select("*");

  // Lista de campos por los que se puede filtrar
  const filterableFields = [
    "profile_id",
    "event_id",
  ];

  filterableFields.forEach((field) => {
    const value = searchParams.get(field);
    if (value) {
      query = query.eq(field, value);
    }
  });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching event attendees:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

// crear un nuevo event attendee
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }
  const supabase = await createClient();

  // Solo usuarios con username pueden apuntarse (no venues)
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .single();

  if (!profile?.username) {
    return NextResponse.json({ error: "Solo los usuarios pueden confirmar asistencia" }, { status: 403 });
  }

  const body = await request.json();

  const {
    event_id,
  } = body;


  const { data, error } = await supabase
    .from("event_attendees")
    .insert({
      profile_id : userId,
      event_id: event_id
    })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}
