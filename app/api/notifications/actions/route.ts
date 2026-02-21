// app/api/notifications/actions/route.ts
import { getUserId } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
    const { action } = body;

    switch (action) {
      case 'mark_all_read': {
        // Marcar todas como leídas
        const { error } = await supabase
          .from('notifications')
          .update({ 
            is_read: true, 
            read_at: new Date().toISOString() 
          })
          .eq('user_id', userId)
          .eq('is_read', false);

        if (error) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          );
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Todas las notificaciones marcadas como leídas' 
        });
      }

      case 'delete_all_read': {
        // Eliminar todas las leídas
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', userId)
          .eq('is_read', true);

        if (error) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          );
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Notificaciones leídas eliminadas' 
        });
      }

      case 'archive_all': {
        // Archivar todas
        const { error } = await supabase
          .from('notifications')
          .update({ is_archived: true })
          .eq('user_id', userId)
          .eq('is_archived', false);

        if (error) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          );
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Todas las notificaciones archivadas' 
        });
      }

      case 'get_unread_count': {
        // Obtener conteo de no leídas
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false)
          .eq('is_archived', false);

        if (error) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          );
        }

        return NextResponse.json({ 
          success: true, 
          unreadCount: count || 0 
        });
      }

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error en POST /api/notifications/actions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}