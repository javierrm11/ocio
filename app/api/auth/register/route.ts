import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { username, email, password, role, name, avatar_path, description } = await request.json();
  // añadir a tabla profiles
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, name, role, avatar_path, description },
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
