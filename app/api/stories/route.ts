// app/api/stories/route.ts
import { getUserId } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// obtener todas las stories
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  let query = supabase
    .from("stories")
    .select("*, venues(name, avatar_path)") // ✅ Incluir datos del local
    .gt("expires_at", new Date().toISOString()) // ✅ Solo stories activas
    .order("created_at", { ascending: true });

  const filterableFields = [
    "venue_id",
    "media_type",
    "media_path",
    "created_at",
    "expires_at",
  ];

  filterableFields.forEach((field) => {
    const value = searchParams.get(field);
    if (value) {
      query = query.eq(field, value);
    }
  });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching stories:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

// crear una nueva story con imagen/video
export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    console.log('User ID:', userId);

    const supabase = await createClient();
    
    // Parsear FormData
    const formData = await request.formData();
    const media = formData.get('media') as File;
    const media_type = formData.get('media_type') as string;

    console.log('Media file:', media?.name, media?.type, media?.size);

    if (!media) {
      return NextResponse.json(
        { error: 'Se requiere un archivo de media' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const isValidType = [...allowedImageTypes, ...allowedVideoTypes].includes(media.type);

    if (!isValidType) {
      return NextResponse.json(
        { error: `Tipo de archivo no válido: ${media.type}. Solo se permiten imágenes (jpg, png, gif, webp) y videos (mp4, webm, mov)` },
        { status: 400 }
      );
    }

    // Validar tamaño (max 50MB para videos, 10MB para imágenes)
    const maxSize = media.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (media.size > maxSize) {
      return NextResponse.json(
        { error: `El archivo es demasiado grande. Tamaño: ${(media.size / 1024 / 1024).toFixed(2)}MB. Máximo ${media.type.startsWith('video/') ? '50MB' : '10MB'}` },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const fileExt = media.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    console.log('Uploading to path:', filePath);

    // Convertir File a ArrayBuffer para Supabase
    const arrayBuffer = await media.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Subir archivo al bucket 'images' de Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, buffer, {
        contentType: media.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error subiendo archivo a Supabase:', uploadError);
      console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
      return NextResponse.json(
        { error: `Error al subir el archivo: ${uploadError.message}` },
        { status: 500 }
      );
    }

    console.log('Upload successful:', uploadData);

    // Obtener URL pública del archivo
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    const media_path = publicUrlData.publicUrl;
    console.log('Public URL:', media_path);

    // Calcular fecha de expiración (24 horas desde ahora)
    const now = new Date();
    const expires_at = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    // Insertar story en la base de datos
    const { data, error } = await supabase
      .from("stories")
      .insert({
        venue_id: userId,
        media_type: media_type || (media.type.startsWith('video/') ? 'video' : 'image'),
        media_path,
        created_at: now.toISOString(),
        expires_at,
      })
      .select();

    if (error) {
      // Si falla la inserción en BD, eliminar el archivo subido
      console.error('Error creando story en BD:', error);
      await supabase.storage
        .from('images')
        .remove([filePath]);
      
      return NextResponse.json(
        { error: `Error creando story: ${error.message}` },
        { status: 400 }
      );
    }

    console.log('Story created successfully:', data);

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error en POST /api/stories:', error);
    return NextResponse.json(
      { error: `Error interno del servidor: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}