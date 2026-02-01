import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/get-user";

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: "Logout successful" }, { status: 200 });
}
