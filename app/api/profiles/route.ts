import { getUserId } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  let query = supabase.from("profiles").select("*");

  const filterableFields = [
    "username",
    "name",
    "avatar_path",
    "description",
  ];

  filterableFields.forEach((field) => {
    const value = searchParams.get(field);
    if (value) {
      query = query.ilike(field, `%${value}%`);
    }
  });

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching profiles:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}