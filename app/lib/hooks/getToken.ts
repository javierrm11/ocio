// lib/getToken.ts
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))
    ?.split('=')[1];

  return cookie || null;
}