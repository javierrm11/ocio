import { getUserId } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

  let query = supabase.from("events").select("*");

  // Lista de campos por los que se puede filtrar
  const filterableFields = [
    "venue_id",
    "title",
    "description",
    "starts_date",
    "ends_date",
    "featured",
  ];

  filterableFields.forEach((field) => {
    const value = searchParams.get(field);
    if (value) {
      query = query.ilike(field, `%${value}%`);
    }
  });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

// crear un nuevo event
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
    venue_id,
    title,
    description,
    starts_at,
    ends_at,
    featured
  } = body;


  const { data, error } = await supabase
    .from("events")
    .insert({
      venue_id,
      title,
      description,
      starts_at,
      ends_at,
      featured
    })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}
