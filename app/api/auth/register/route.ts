import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  
  try {
    // Recibir FormData en lugar de JSON
    const formData = await request.formData();
    
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string || 'user';
    const name = formData.get('name') as string;
    const description = formData.get('description') as string || '';
    const type = formData.get('type') as string || 'user';
    const avatarFile = formData.get('avatar') as File | null;

    let avatar_path = null;

    // Si hay un archivo de avatar, subirlo a Supabase Storage
    if (avatarFile && avatarFile.size > 0) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${username}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

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

    // Crear usuario con Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          username, 
          name, 
          role, 
          avatar_path, 
          description, 
          type 
        },
      }
    });

    if (error) {
      // Si hay error y se subió un avatar, eliminarlo
      if (avatar_path) {
        await supabase.storage
          .from('avatar')
          .remove([avatar_path]);
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ...data,
      avatar_path
    });

  } catch (error: any) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error al procesar el registro: ' + error.message },
      { status: 500 }
    );
  }
}