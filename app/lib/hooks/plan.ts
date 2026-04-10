export function isPremium(user: { plan?: string }): boolean {
  if (user.plan !== 'premium') return false;
  return true;
}