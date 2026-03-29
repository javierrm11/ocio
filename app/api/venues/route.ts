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

    let avatar_path = null;

    // Si hay un archivo de avatar, subirlo a Supabase Storage
    if (avatarFile && avatarFile.size > 0) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${name}-${Date.now()}.${fileExt}`;
      const filePath = `venues/${fileName}`;

      // Subir archivo al bucket 'avatar'
      const { data: uploadData, error: uploadError } = await supabase.storage
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

      // Obtener URL pública del avatar
      const { data: { publicUrl } } = supabase.storage
        .from('avatar')
        .getPublicUrl(filePath);

      avatar_path = publicUrl;
    }

  // añadir a tabla profiles
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, description, address, latitude, longitude, type, avatar_path },
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