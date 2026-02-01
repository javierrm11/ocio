import { getUserId } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// obtener todas las companies, con filtro opcional por cualquier campo
export async function GET(request: Request) {

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  // Update the query to join with the venues table
  let query = supabase
    .from("stories")
    .select("*, venues(name)"); // This selects all fields from stories and all fields from the related venues

  // Lista de campos por los que se puede filtrar
  const filterableFields = [
    "venue_id",
    "media_type",
    "media_path",
    "created_at",
    "expires_at",
  ];

  // Aplicar filtros basados en los parámetros de búsqueda
  filterableFields.forEach((field) => {
    const value = searchParams.get(field);
    if (value) {
      query = query.eq(field, value);
    }
  });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching stories:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}



// crear un nuevo story
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
    media_type,
    media_path,
    created_at,
    expires_at,
  } = body;


  const { data, error } = await supabase
    .from("stories")
    .insert({
      venue_id,
      media_type,
      media_path,
      created_at,
      expires_at,
    })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}
