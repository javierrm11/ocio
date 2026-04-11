import { getUserId } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { haversineKm } from "@/lib/utils/distance";
import { NextResponse } from "next/server";

const PRESENCE_RADIUS_KM = 0.3; // 300 metros

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

  let query = supabase.from("check_ins").select("*, venues(*)");

  // Lista de campos por los que se puede filtrar
  const filterableFields = [
    "profile_id",
    "venue_id",
  ];

  filterableFields.forEach((field) => {
    const value = searchParams.get(field);
    if (value) {
      query = query.eq(field, value);
    }
  });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching check-ins:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

// crear un nuevo check-in
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

  const { venue_id, user_lat, user_lng } = body;

  // Validar ubicación del usuario respecto al venue
  let location_valid = false;

  if (user_lat != null && user_lng != null) {
    const { data: venue } = await supabase
      .from("venues")
      .select("latitude, longitude")
      .eq("id", venue_id)
      .single();

    if (venue) {
      const distKm = haversineKm(user_lat, user_lng, venue.latitude, venue.longitude);
      location_valid = distKm <= PRESENCE_RADIUS_KM;
    }
  }

  const { data, error } = await supabase
    .from("check_ins")
    .insert({
      profile_id: userId,
      venue_id,
      user_lat: user_lat ?? null,
      user_lng: user_lng ?? null,
      location_valid,
    })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}
