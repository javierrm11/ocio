import { getUserId } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// obtener todas las notificaciones con filtro de usuario
export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }
  const supabase = await createClient();

  const query = supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ notifications: data });
}

// crear una nueva notificación
export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();
    
    const {
      target_user_id,
      type,
      title,
      message,
      data = {},
      action_url,
      image_url
    } = body;

    // Validaciones
    if (!target_user_id || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Campos requeridos: target_user_id, type, title, message' },
        { status: 400 }
      );
    }

    // Crear notificación
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: target_user_id,
        type,
        title,
        message,
        data,
        action_url,
        image_url
      })
      .select()
      .single();

    if (error) {
      console.error('Error creando notificación:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('Error en POST /api/notifications:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}




