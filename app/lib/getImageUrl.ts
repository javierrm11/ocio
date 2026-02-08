// lib/getImageUrl.ts
import { createClient } from '@/lib/supabase/client';

export function getPublicImageUrl(imagePath: string | null): string {
  if (!imagePath) {
    return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800'; // Imagen por defecto
  }

  const supabase = createClient();
  
  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(imagePath);

  return data.publicUrl;
}