import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getUser } from "@/lib/auth/get-user";
import { NextResponse } from "next/server";

export async function DELETE() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const supabase = await createClient();
  const isVenue = user.user_metadata?.type === "venue";

  // Con CASCADE en FK, borrar el registro padre elimina automáticamente los hijos
  if (isVenue) {
    await supabase.from("venues").delete().eq("id", user.id);
  } else {
    await supabase.from("profiles").delete().eq("id", user.id);
  }

  // Eliminar el usuario de Supabase Auth (requiere service role)
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await adminClient.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("Error eliminando usuario de auth:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Cuenta eliminada" }, { status: 200 });
}
