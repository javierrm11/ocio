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

  // Obtener venue con schedule y eventos activos
  const { data: venue } = await supabase
    .from("venues")
    .select("latitude, longitude, schedule, events(*)")
    .eq("id", venue_id)
    .single();

  if (!venue) {
    return NextResponse.json({ error: "Local no encontrado" }, { status: 404 });
  }

  // Comprobar si hay evento activo ahora mismo
  const nowUTC = new Date();
  // Convertir a hora local de España para comparar con los horarios del local
  const now = new Date(nowUTC.toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  const hasActiveEvent = Array.isArray((venue as any).events) &&
    (venue as any).events.some(
      (e: any) => new Date(e.starts_at) <= nowUTC && new Date(e.ends_at) >= nowUTC
    );

  // Comprobar si el local está abierto según su horario
  if (!hasActiveEvent && venue.schedule?.length) {
    const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    const todayName = dayNames[now.getDay()];
    const today = (venue.schedule as any[]).find((d: any) => d.day === todayName);

    if (today) {
      if (today.is_closed) {
        return NextResponse.json(
          { error: "El local está cerrado hoy. Solo puedes hacer check-in durante un evento." },
          { status: 403 }
        );
      }

      const cur = now.getHours() * 60 + now.getMinutes();
      const [oh, om] = today.open.split(":").map(Number);
      const [ch, cm] = today.close.split(":").map(Number);
      const op = oh * 60 + om;
      const cl = ch * 60 + cm;
      const isOpen = cl < op ? (cur >= op || cur < cl) : (cur >= op && cur < cl);

      if (!isOpen) {
        return NextResponse.json(
          { error: `El local está cerrado ahora. Abre a las ${today.open}.` },
          { status: 403 }
        );
      }
    }
  }

  // Validar ubicación del usuario respecto al venue
  let location_valid = false;

  if (user_lat != null && user_lng != null) {
    const distKm = haversineKm(user_lat, user_lng, venue.latitude, venue.longitude);
    location_valid = distKm <= PRESENCE_RADIUS_KM;
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
