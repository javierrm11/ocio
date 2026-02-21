import { getUser, getUserId } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getUser();
  
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const supabase = await createClient();
  if(user.user_metadata.type == "venue"){
    const { data, error } = await supabase
    .from("venues")
    .select("*, events(*), check_ins(*)")
    .eq("id", user.id);
    if (error) {
      console.error("Error fetching venue profile:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data);
  }
  const { data, error } = await supabase
  .from("profiles")
  .select(`
    *,
    favorites(
      *,
      venues(*)
    )
  `)
  .eq("id", user.id);

  if (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

// editar perfil
export async function PATCH(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const supabase = await createClient();
  const { username, name, avatar_path, description } = await request.json();
  const { data, error } = await supabase
    .from("profiles")
    .update({ username, name, avatar_path, description })
    .eq("id", userId)
    .select()
    .single();
  if (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}
