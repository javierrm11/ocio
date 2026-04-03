import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// obtener todas las companies, con filtro opcional por cualquier campo
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  let query = supabase
  .from("venues")
  .select(`
    *,
    events(*),
    check_ins(*)
  `)
  .eq('check_ins.active', true)

  // Lista de campos por los que se puede filtrar
  const filterableFields = [
    "name",
    "description",
    "address",
    "latitude",
    "longitude",
  ];

  filterableFields.forEach((field) => {
    const value = searchParams.get(field);
    if (value) {
      query = query.ilike(field, `%${value}%`);
    }
  });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching venues:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

// crear un nuevo venue
export async function POST(request: Request) {
  const supabase = await createClient();
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const address = formData.get("address") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);
  const type = formData.get("type") as string || "venue";
  const avatarFile = formData.get("avatar") as File | null;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Géneros: se envían como JSON string desde el frontend
  const genreIds: number[] = JSON.parse(formData.get("genre_ids") as string || "[]");

  let avatar_path = null;

  if (avatarFile && avatarFile.size > 0) {
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${name}-${Date.now()}.${fileExt}`;
    const filePath = `venues/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatar')
      .upload(filePath, avatarFile, {
        contentType: avatarFile.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Error al subir avatar:', uploadError);
      return NextResponse.json(
        { error: 'Error al subir la imagen: ' + uploadError.message },
        { status: 400 }
      );
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatar')
      .getPublicUrl(filePath);

    avatar_path = publicUrl;
  }

  // Crear usuario en auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, description, address, latitude, longitude, type, avatar_path },
    }
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Insertar géneros si se proporcionaron
  if (genreIds.length > 0 && data.user?.id) {
    const rows = genreIds.map(genre_id => ({
      venue_id: data.user!.id,
      genre_id,
    }));

    const { error: genreError } = await supabase
      .from("venue_genres")
      .insert(rows);

    if (genreError) {
      console.error("Error al insertar géneros:", genreError);
      // No bloqueamos el registro, solo avisamos
      return NextResponse.json({
        ...data,
        warning: "Venue creado pero hubo un error al guardar los géneros",
      });
    }
  }

  return NextResponse.json(data);
}