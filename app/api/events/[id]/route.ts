// app/api/events/[id]/route.ts
import { getUserId } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id es requerido" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("events")
    .select("*, venues(*), event_attendees(*)")
    .eq("id", id)
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: "Event no encontrado" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const supabase = await createClient();
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "id es requerido" }, { status: 400 });
  }

  try {
    const formData = await request.formData();

    const venue_id = formData.get('venue_id') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';
    const starts_at = formData.get('starts_at') as string;
    const ends_at = formData.get('ends_at') as string;
    const featured = formData.get('featured') === 'true';
    const imageFile = formData.get('image') as File | null;

    // Verificar que existe antes de actualizar
    const { data: existing, error: checkError } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Event no encontrado" }, { status: 404 });
    }

    let image_path = formData.get('image_path') as string | null ?? existing.image_path;

    // Si hay nueva imagen, subirla al storage
    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${fileExt}`;
      const filePath = `events/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(filePath, imageFile, {
          contentType: imageFile.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Error al subir imagen:', uploadError);
        return NextResponse.json(
          { error: 'Error al subir la imagen: ' + uploadError.message },
          { status: 400 }
        );
      }

      const { data: { publicUrl } } = supabase.storage
        .from('events')
        .getPublicUrl(filePath);

      image_path = publicUrl;
    }

    const { data, error } = await supabase
      .from("events")
      .update({ venue_id, title, description, starts_at, ends_at, featured, image_path })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Error en actualización de evento:', error);
    return NextResponse.json(
      { error: 'Error al procesar la actualización: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const supabase = await createClient();
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id es requerido" }, { status: 400 });
  }
  const { data: existing, error: checkError } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();
  if (checkError || !existing) {
    return NextResponse.json({ error: "Event no encontrado" }, { status: 404 });
  }
  const { data, error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true, data });
}