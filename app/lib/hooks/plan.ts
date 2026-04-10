export function isPremium(user: { plan?: string; plan_expires_at?: string | null }): boolean {
  if (user.plan !== 'premium') return false;
  if (!user.plan_expires_at) return true;
  return new Date(user.plan_expires_at) > new Date();
}