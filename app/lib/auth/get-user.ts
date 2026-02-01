import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Extrae el user ID del token de Supabase
 * Uso: const userId = await getUserId(request)
 */
export async function getUserId(request?: Request): Promise<string | null> {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user.id;
}

/**
 * Extrae el user completo del token de Supabase
 * Devuelve todos los datos del usuario
 */
export async function getUser() {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

/**
 * Middleware helper que retorna error 401 si no hay usuario
 * Uso en API routes:
 * 
 * const user = await requireAuth();
 * if (!user) return; // Ya respondió con 401
 */
export async function requireAuth() {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }
  
  return user;
}

/**
 * Extrae el organization_id del user metadata
 */
export async function getOrganizationId(): Promise<string | null> {
  const user = await getUser();
  
  if (!user) {
    return null;
  }
  
  // Si guardaste organization_id en metadata al registrar
  return user.user_metadata?.organization_id || null;
}