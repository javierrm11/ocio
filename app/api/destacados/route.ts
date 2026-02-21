import { getUserId } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// obtener todas las companies, con filtro opcional por cualquier campo
export async function GET(request: Request) {
  const supabase = await createClient();
  
  const query = supabase.from("events").select("*").order("created_at", { ascending: false }).limit(5);

  const query_venues = supabase.from("venues").select("*, check_ins(*)").order("created_at", { ascending: false }).limit(5);

    const { data: events, error: eventsError } = await query;
    const { data: venues, error: venuesError } = await query_venues;
    const topVenues = venues
  ?.sort((a, b) => (b.check_ins?.length || 0) - (a.check_ins?.length || 0))
  .slice(0, 5);
    if (eventsError) {
        console.error("Error fetching events:", eventsError);
        return NextResponse.json({ error: "Error fetching events" }, { status: 500 });
    }
    if (venuesError) {
        console.error("Error fetching venues:", venuesError);
        return NextResponse.json({ error: "Error fetching venues" }, { status: 500 });
    }


  return NextResponse.json({ events, venues: topVenues });
}