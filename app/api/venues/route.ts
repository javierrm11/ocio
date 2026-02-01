import { getUserId } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { profile } from "console";
import { NextResponse } from "next/server";
import { use } from "react";

// obtener todas las companies, con filtro opcional por cualquier campo
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  let query = supabase.from("venues").select("*");

  // Lista de campos por los que se puede filtrar
  const filterableFields = [
    "name",
    "description",
    "address",
    "latitude",
    "longitude",
    "ambience_level",
  ];

  filterableFields.forEach((field) => {
    const value = searchParams.get(field);
    if (value) {
      query = query.ilike(field, `%${value}%`);
    }
  });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching venues:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

// crear un nuevo venue
export async function POST(request: Request) {
  const supabase = await createClient();
  const { email, password, name, description, address, latitude, longitude, ambience_level, type } = await request.json();
  // añadir a tabla profiles
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, description, address, latitude, longitude, ambience_level, type},
    }
  })
    if (error) {
        return NextResponse.json(
        { error: error.message },
        { status: 400 }
        );
    }  
  return NextResponse.json(data);
}