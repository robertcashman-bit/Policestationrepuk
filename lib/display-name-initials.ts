/** Initials for avatar placeholders — never invent photos. */
export function initialsFromName(name: string): string {
  const cleaned = (name || '')
    .replace(/[^a-zA-Z\s'-]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
  if (!cleaned) return '?';
  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}
