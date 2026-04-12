// lib/getToken.ts
// Returns a truthy value when the user has an active session, null otherwise.
// The actual auth tokens are stored in httpOnly cookies managed by Supabase SSR —
// this only reads the non-sensitive session indicator set at login.
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;

  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith('session='))
    ?.split('=')[1];

  return cookie || null;
}