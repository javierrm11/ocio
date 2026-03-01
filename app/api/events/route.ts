import { getUserId } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// obtener todas las companies, con filtro opcional por cualquier campo
export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  let query = supabase.from("events").select("*, event_attendees(*)");

  // Lista de campos por los que se puede filtrar
  const filterableFields = [
    "venue_id",
    "title",
    "description",
    "starts_date",
    "ends_date",
    "featured",
  ];

  filterableFields.forEach((field) => {
    const value = searchParams.get(field);
    if (value) {
      query = query.ilike(field, `%${value}%`);
    }
  });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

// crear un nuevo event
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }

  const supabase = await createClient();
  const formData = await request.formData();

  const venue_id = formData.get("venue_id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const starts_at = formData.get("starts_at") as string;
  const ends_at = formData.get("ends_at") as string;
  const featured = formData.get("featured") === "true";
  const imageFile = formData.get("image") as File | null;

  let image_path = null;

  // Si hay un archivo de imagen, subirlo a Supabase Storage
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${title.replace(/\s+/g, '-')}-${Date.now()}.${fileExt}`;
    const filePath = `events/${fileName}`;

    // Subir archivo al bucket 'events'
    const { data: uploadData, error: uploadError } = await supabase.storage
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

    // Obtener URL pública de la imagen
    const { data: { publicUrl } } = supabase.storage
      .from('events')
      .getPublicUrl(filePath);

    image_path = publicUrl;
  }

  // Insertar evento en la base de datos
  const { data, error } = await supabase
    .from("events")
    .insert({
      venue_id,
      title,
      description,
      starts_at,
      ends_at,
      featured,
      image_path
    })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}