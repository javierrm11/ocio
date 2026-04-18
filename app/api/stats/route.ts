import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { isPremium } from "@/lib/hooks/plan";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const meta = user.user_metadata as { type?: string };
  const supabase = await createClient();
  const isVenue = meta.type === "venue";

  // Obtener plan desde la tabla correspondiente (venues o profiles)
  const table = isVenue ? "venues" : "profiles";
  const { data: accountData } = await supabase
    .from(table)
    .select("plan")
    .eq("id", user.id)
    .single();

  if (!isPremium({ plan: accountData?.plan })) {
    return NextResponse.json({ error: "Plan premium requerido" }, { status: 403 });
  }

  if (isVenue) {
    // Estadísticas del local
    const { data: checkins, error } = await supabase
      .from("check_ins")
      .select("created_at, active")
      .eq("venue_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const { data: events } = await supabase
      .from("events")
      .select("id, title, starts_at, event_attendees(count)")
      .eq("venue_id", user.id);

    const total = checkins?.length ?? 0;

    // Hora pico (la hora con más check-ins)
    const hourCount: Record<number, number> = {};
    for (const c of checkins ?? []) {
      const h = new Date(c.created_at).getHours();
      hourCount[h] = (hourCount[h] ?? 0) + 1;
    }
    const peakHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const hourlyData = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}h`, count: hourCount[h] ?? 0 }));

    // Check-ins por día (últimos 30 días)
    const byDay: Record<string, number> = {};
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    for (const c of checkins ?? []) {
      const d = c.created_at.slice(0, 10);
      if (new Date(c.created_at) >= cutoff) byDay[d] = (byDay[d] ?? 0) + 1;
    }
    const dailyData = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const daysWithData = Object.keys(byDay).length;
    const dailyAvg = daysWithData > 0 ? Math.round(total / Math.max(daysWithData, 1)) : 0;

    // Top eventos por asistentes
    const topEvents = (events ?? [])
      .map((e: any) => ({ title: e.title, date: e.starts_at, attendees: e.event_attendees?.[0]?.count ?? 0 }))
      .sort((a: any, b: any) => b.attendees - a.attendees)
      .slice(0, 5);

    return NextResponse.json({
      type: "venue",
      total_checkins: total,
      peak_hour: peakHour !== undefined ? `${peakHour}:00` : null,
      daily_avg: dailyAvg,
      daily_data: dailyData,
      hourly_data: hourlyData,
      top_events: topEvents,
    });
  }

  // Estadísticas de usuario
  const { data: checkins, error } = await supabase
    .from("check_ins")
    .select("created_at, venue_id, venues(name, avatar_path)")
    .eq("profile_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const total = checkins?.length ?? 0;

  // Locales más visitados
  const venueCount: Record<string, { name: string; avatar_path: string | null; count: number }> = {};
  for (const c of checkins ?? []) {
    const v = c.venues as any;
    if (!venueCount[c.venue_id]) venueCount[c.venue_id] = { name: v?.name ?? "Desconocido", avatar_path: v?.avatar_path ?? null, count: 0 };
    venueCount[c.venue_id].count++;
  }
  const topVenues = Object.values(venueCount).sort((a, b) => b.count - a.count).slice(0, 5);

  // Día de la semana favorito
  const dayCount: Record<number, number> = {};
  const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  for (const c of checkins ?? []) {
    const d = new Date(c.created_at).getDay();
    dayCount[d] = (dayCount[d] ?? 0) + 1;
  }
  const favDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];

  // Check-ins por mes (últimos 6 meses)
  const monthCount: Record<string, number> = {};
  for (const c of checkins ?? []) {
    const m = c.created_at.slice(0, 7);
    monthCount[m] = (monthCount[m] ?? 0) + 1;
  }
  const monthlyData = Object.entries(monthCount)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, count]) => ({ month, count }));

  return NextResponse.json({
    type: "user",
    total_checkins: total,
    top_venues: topVenues,
    fav_day: favDay ? DAYS[Number(favDay[0])] : null,
    fav_day_count: favDay ? favDay[1] : 0,
    monthly_data: monthlyData,
  });
}