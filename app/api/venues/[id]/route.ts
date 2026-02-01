// app/api/events/[id]/route.ts
import { getUserId } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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
        venue_id
    } = body;
    const { id } = await params;

    if (!id) {
        return NextResponse.json(
            { error: 'id es requerido' },
            { status: 400 }
        );
    }

    // Verificar que existe antes de actualizar
    const { data: existing, error: checkError } = await supabase
        .from('check_ins')
        .select('*')
        .eq('id', id)
        .single();

    if (checkError || !existing) {
        return NextResponse.json(
            { error: 'Check-in no encontrado' },
            { status: 404 }
        );
    }

    // Intentar actualizar los campos permitidos
    const { data, error } = await supabase
        .from('check_ins')
        .update({
            venue_id
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const userId = await getUserId();
      if (!userId) {
        return NextResponse.json(
          { error: 'No autenticado' },
          { status: 401 }
        );
      }
    const supabase = await createClient();
    const { id } = await params;
    if (!id) {
        return NextResponse.json(
        { error: 'id es requerido' },
        { status: 400 }
        );
    }
    // VERIFICAR QUE EXISTE ANTES DE ELIMINAR
    const { data: existing, error: checkError } = await supabase
        .from('check_ins')
        .select('*')
        .eq('id', id)
        .single();
    if (checkError || !existing) {
        return NextResponse.json(
        { error: 'Check-in no encontrado' },
        { status: 404 }
        );
    }
    // INTENTAR ELIMINAR
    const { data, error, status, statusText } = await supabase
        .from('check_ins')
        .delete()
        .eq('id', id)
        .select()
        .single();
    if (error) {
        return NextResponse.json(
        { error: error.message },
        { status: 400 }
        );
    }
    return NextResponse.json({ success: true, data });
    }
