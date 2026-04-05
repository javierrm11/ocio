import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getUser();
  
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const supabase = await createClient();
  if(user.user_metadata.type == "venue"){
    const { data, error } = await supabase
    .from("venues")
    .select("*, events(*, event_attendees(count) genres: event_genres (genre_id, genre: genres (id, name, slug, emoji))), check_ins(*), genres:venue_genres (genre_id, genre:genres (id, name, slug, emoji))")
    .eq("id", user.id);
    if (error) {
      console.error("Error fetching venue profile:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data);
  }
  const { data, error } = await supabase
  .from("profiles")
  .select(`
    *,
    favorites(
      *,
      venues(*)
    ),
    check_ins(*, venues(*))
  `)
  .eq("id", user.id);

  if (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

// editar perfil
export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const supabase = await createClient();

  try {
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const username = formData.get('username') as string | null;
    const description = formData.get('description') as string || '';
    const avatarFile = formData.get('avatar') as File | null;

    const isVenue = user.user_metadata.type === "venue";
    const identifier = name || user.user_metadata.username || user.id;

    let avatar_path = formData.get('avatar_path') as string | null;

    // Si hay nueva imagen, subirla al storage
    if (avatarFile && avatarFile.size > 0) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${identifier}-${Date.now()}.${fileExt}`;
      const filePath = isVenue ? `venues/${fileName}` : `avatars/${fileName}`;

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

    if (isVenue) {
      const { data, error } = await supabase
        .from("venues")
        .update({ name, avatar_path, description })
        .eq("id", user.id)
        .select()
        .single();
      if (error) {
        console.error("Error updating venue profile:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json(data);
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ username, name, avatar_path, description })
      .eq("id", user.id)
      .select()
      .single();
    if (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error en actualización de perfil:', error);
    return NextResponse.json(
      { error: 'Error al procesar la actualización: ' + error.message },
      { status: 500 }
    );
  }
}